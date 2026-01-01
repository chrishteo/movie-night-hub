-- Admin Email Notification Triggers
--
-- BEFORE RUNNING THIS MIGRATION:
-- 1. Replace <YOUR_PROJECT_REF> with your Supabase project reference (e.g., "abcdefghijklmnop")
-- 2. Replace <YOUR_ANON_KEY> with your Supabase anon/public key
-- 3. Make sure you've deployed the send-notification edge function
-- 4. Make sure you've set RESEND_API_KEY and ADMIN_EMAIL secrets in Supabase

-- Enable pg_net extension for HTTP calls from database
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to send notification to admin via edge function
CREATE OR REPLACE FUNCTION notify_admin()
RETURNS TRIGGER AS $$
DECLARE
  payload jsonb;
  event_type text;
  supabase_url text := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/send-notification';
  anon_key text := '<YOUR_ANON_KEY>';
BEGIN
  -- Determine event type and build payload based on table and operation
  IF TG_TABLE_NAME = 'users' THEN
    IF TG_OP = 'INSERT' THEN
      event_type := 'new_user';
      payload := jsonb_build_object(
        'name', NEW.name,
        'avatar', COALESCE(NEW.avatar, '')
      );
    ELSIF TG_OP = 'UPDATE' THEN
      -- Only notify if name or avatar changed
      IF NEW.name IS DISTINCT FROM OLD.name OR NEW.avatar IS DISTINCT FROM OLD.avatar THEN
        event_type := 'profile_change';
        payload := jsonb_build_object(
          'name', NEW.name,
          'old_name', OLD.name,
          'avatar', COALESCE(NEW.avatar, '')
        );
      ELSE
        -- No significant change, skip notification
        RETURN NEW;
      END IF;
    END IF;

  ELSIF TG_TABLE_NAME = 'bug_reports' THEN
    IF TG_OP = 'INSERT' THEN
      event_type := 'bug_report';
      payload := jsonb_build_object(
        'title', NEW.title,
        'description', COALESCE(NEW.description, ''),
        'user_name', COALESCE(NEW.user_name, 'Unknown')
      );
    ELSE
      -- Only notify on INSERT for bug reports
      RETURN NEW;
    END IF;
  END IF;

  -- Only proceed if we have an event to send
  IF event_type IS NOT NULL AND payload IS NOT NULL THEN
    -- Call edge function via pg_net (async, non-blocking)
    PERFORM net.http_post(
      url := supabase_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || anon_key
      ),
      body := jsonb_build_object(
        'type', event_type,
        'data', payload
      )::text
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_new_user_notify ON users;
CREATE TRIGGER on_new_user_notify
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin();

-- Create trigger for user profile updates
DROP TRIGGER IF EXISTS on_user_update_notify ON users;
CREATE TRIGGER on_user_update_notify
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin();

-- Create trigger for new bug reports
DROP TRIGGER IF EXISTS on_bug_report_notify ON bug_reports;
CREATE TRIGGER on_bug_report_notify
  AFTER INSERT ON bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION notify_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_admin() TO service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Notification triggers created successfully!';
  RAISE NOTICE 'Remember to:';
  RAISE NOTICE '1. Deploy the send-notification edge function';
  RAISE NOTICE '2. Set RESEND_API_KEY and ADMIN_EMAIL secrets';
  RAISE NOTICE '3. Replace <YOUR_PROJECT_REF> and <YOUR_ANON_KEY> in this migration';
END $$;
