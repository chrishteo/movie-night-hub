-- Migration: Add DELETE policies for movie_nights table
-- The existing "Users can manage own movie nights" policy only covers UPDATE, not DELETE

-- Drop existing policy if it exists (in case we need to recreate)
DROP POLICY IF EXISTS "Users can delete own movie nights" ON movie_nights;
DROP POLICY IF EXISTS "Admins can delete any movie night" ON movie_nights;

-- Allow users to delete their own movie nights
CREATE POLICY "Users can delete own movie nights" ON movie_nights
  FOR DELETE USING (user_id = auth.uid());

-- Allow admins to delete any movie night
-- This uses the is_admin column from the users table
CREATE POLICY "Admins can delete any movie night" ON movie_nights
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Also add admin policy for UPDATE (so admins can edit any movie night)
DROP POLICY IF EXISTS "Admins can update any movie night" ON movie_nights;
CREATE POLICY "Admins can update any movie night" ON movie_nights
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.is_admin = true
    )
  );
