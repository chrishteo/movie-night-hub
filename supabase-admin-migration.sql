-- ============================================================
-- MOVIE NIGHT HUB - ADMIN FEATURE MIGRATION
-- ============================================================
-- Run this script in Supabase SQL Editor AFTER the security migration
-- This adds admin functionality, announcements, and bug reporting
-- ============================================================

-- STEP 1: Add is_admin column to users table
-- ============================================================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- STEP 2: Create announcements table
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'update', 'maintenance')),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ
);

-- STEP 3: Create bug_reports table
-- ============================================================
CREATE TABLE IF NOT EXISTS bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- STEP 4: Create indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(active);
CREATE INDEX IF NOT EXISTS idx_announcements_expires ON announcements(expires_at);
CREATE INDEX IF NOT EXISTS idx_bug_reports_user_id ON bug_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- STEP 5: Enable RLS on new tables
-- ============================================================
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- STEP 6: Create helper function to check if user is admin
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE auth_id = auth.uid()
    AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql;

-- STEP 7: Drop existing policies for idempotency
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view active announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
DROP POLICY IF EXISTS "Users can view own bug reports" ON bug_reports;
DROP POLICY IF EXISTS "Admins can view all bug reports" ON bug_reports;
DROP POLICY IF EXISTS "Users can create bug reports" ON bug_reports;
DROP POLICY IF EXISTS "Admins can update bug reports" ON bug_reports;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Admins can delete any movie" ON movies;
DROP POLICY IF EXISTS "Admins can update any movie" ON movies;

-- STEP 8: Create RLS policies for announcements
-- ============================================================

-- Anyone can view active announcements
CREATE POLICY "Anyone can view active announcements" ON announcements
  FOR SELECT USING (active = TRUE AND (expires_at IS NULL OR expires_at > NOW()));

-- Admins can do everything with announcements
CREATE POLICY "Admins can manage announcements" ON announcements
  FOR ALL USING (is_admin());

-- STEP 9: Create RLS policies for bug_reports
-- ============================================================

-- Users can view their own bug reports
CREATE POLICY "Users can view own bug reports" ON bug_reports
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR is_admin()
  );

-- Authenticated users can create bug reports
CREATE POLICY "Users can create bug reports" ON bug_reports
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only admins can update bug reports
CREATE POLICY "Admins can update bug reports" ON bug_reports
  FOR UPDATE USING (is_admin());

-- Only admins can delete bug reports
CREATE POLICY "Admins can delete bug reports" ON bug_reports
  FOR DELETE USING (is_admin());

-- STEP 10: Update existing policies for admin access
-- ============================================================

-- Drop and recreate movie delete policy to include admin
DROP POLICY IF EXISTS "Users can delete own movies" ON movies;
CREATE POLICY "Users can delete own movies" ON movies
  FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- Drop and recreate movie update policy to include admin
DROP POLICY IF EXISTS "Users can update own movies" ON movies;
CREATE POLICY "Users can update own movies" ON movies
  FOR UPDATE USING (user_id = auth.uid() OR is_admin());

-- Add policy for admins to delete users (but not themselves)
CREATE POLICY "Admins can delete users" ON users
  FOR DELETE USING (
    is_admin()
    AND id != (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- ============================================================
-- MIGRATION COMPLETE!
-- ============================================================
-- After running this script:
-- 1. Create admin account in Supabase Auth:
--    - Go to Authentication > Users > Add User
--    - Email: admin@movienighthub.local
--    - Password: admin!@#123
-- 2. Sign in as admin via the app to create profile
-- 3. Run: UPDATE users SET is_admin = TRUE WHERE name = 'Admin';
-- ============================================================
