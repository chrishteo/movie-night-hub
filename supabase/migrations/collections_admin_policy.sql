-- ============================================================
-- COLLECTIONS ADMIN POLICY MIGRATION
-- ============================================================
-- Run this in Supabase SQL Editor
-- Allows admins to view and manage all collections
-- ============================================================

-- Drop existing SELECT policy and recreate with admin access
DROP POLICY IF EXISTS "Users can view accessible collections" ON collections;

CREATE POLICY "Users can view accessible collections" ON collections
  FOR SELECT USING (
    -- User owns the collection
    user_id = auth.uid()
    -- OR collection is shared with user
    OR EXISTS (
      SELECT 1 FROM collection_shares cs
      JOIN users u ON u.id = cs.shared_with_user_id
      WHERE cs.collection_id = collections.id
      AND u.auth_id = auth.uid()
    )
    -- OR user is admin
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Drop existing DELETE policy and recreate with admin access
DROP POLICY IF EXISTS "Users can delete own collections" ON collections;

CREATE POLICY "Users can delete own collections" ON collections
  FOR DELETE USING (
    -- User owns the collection
    user_id = auth.uid()
    -- OR user is admin
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.is_admin = true
    )
  );

-- ============================================================
-- COLLECTION_MOVIES ADMIN POLICIES
-- ============================================================

-- Update collection_movies SELECT policy to include admin access
DROP POLICY IF EXISTS "Users can view accessible collection movies" ON collection_movies;

CREATE POLICY "Users can view accessible collection movies" ON collection_movies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_movies.collection_id
      AND (
        c.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM collection_shares cs
          JOIN users u ON u.id = cs.shared_with_user_id
          WHERE cs.collection_id = c.id
          AND u.auth_id = auth.uid()
        )
      )
    )
    -- OR user is admin
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.is_admin = true
    )
  );
