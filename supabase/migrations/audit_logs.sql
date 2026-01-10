-- Audit Logs Table
-- Tracks important actions for security and accountability

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,
  user_id UUID,                    -- User who performed the action
  user_email TEXT,                 -- Denormalized for easier querying
  action TEXT NOT NULL,            -- Action type (e.g., 'admin.grant', 'movie.delete')
  target_type TEXT,                -- Type of affected record ('user', 'movie', 'collection')
  target_id UUID,                  -- ID of affected record
  target_name TEXT,                -- Denormalized name for readability
  details JSONB DEFAULT '{}',      -- Additional context
  ip_address TEXT,                 -- Request IP if available
  user_agent TEXT                  -- Browser/client info if available
);

-- Index for common queries
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_type, target_id);

-- RLS Policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.is_admin = true
    )
  );

-- No direct inserts/updates/deletes from client
-- Logs are inserted via service role from API endpoints
CREATE POLICY "No direct client inserts" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "No direct client updates" ON audit_logs
  FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "No direct client deletes" ON audit_logs
  FOR DELETE TO authenticated
  USING (false);

-- Cleanup function for old logs (optional, run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE timestamp < now() - (days_to_keep || ' days')::INTERVAL;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
