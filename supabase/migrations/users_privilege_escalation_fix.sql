-- ============================================================
-- FIX: Users Table Privilege Escalation Vulnerability
-- ============================================================
-- Date: January 2026
-- Issue: Users can set is_admin = true on their own profile
--
-- The original policy only had a USING clause:
--   USING (auth_id = auth.uid())
--
-- This allows users to UPDATE any column on their own row,
-- including is_admin, effectively granting themselves admin.
--
-- This fix adds a WITH CHECK clause that prevents non-admins
-- from changing the is_admin field.
-- ============================================================

-- Drop the vulnerable policy
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create secure policy that prevents admin escalation
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO public
  USING (auth_id = auth.uid())
  WITH CHECK (
    -- User must be updating their own profile
    auth_id = auth.uid()
    AND (
      -- Option 1: is_admin value stays the same as before
      is_admin IS NOT DISTINCT FROM (SELECT u.is_admin FROM users u WHERE u.auth_id = auth.uid())
      -- Option 2: OR the user is already an admin (admins can change anyone's admin status via admin policy)
      OR EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.is_admin = true)
    )
  );

-- Also add a policy for admins to update any user's profile
-- (This allows admins to grant/revoke admin status)
DROP POLICY IF EXISTS "Admins can update any profile" ON users;

CREATE POLICY "Admins can update any profile" ON users
  FOR UPDATE TO public
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.is_admin = true)
  );

-- ============================================================
-- VERIFICATION
-- ============================================================
-- After running this migration, test the following:
--
-- 1. As regular user:
--    - Can update own name/avatar: YES
--    - Can set is_admin = true: NO (should fail)
--
-- 2. As admin:
--    - Can update any user's profile: YES
--    - Can grant/revoke admin: YES
-- ============================================================
