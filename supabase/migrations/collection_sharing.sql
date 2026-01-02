-- ============================================================
-- COLLECTION SHARING MIGRATION
-- ============================================================
-- Run this in Supabase SQL Editor
-- Adds granular sharing for collections
-- ============================================================

-- STEP 1: Create collection_shares table
-- ============================================================
CREATE TABLE IF NOT EXISTS collection_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  can_edit BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_id, shared_with_user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_collection_shares_collection_id ON collection_shares(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_shares_user_id ON collection_shares(shared_with_user_id);

-- STEP 2: Enable RLS on collection_shares
-- ============================================================
ALTER TABLE collection_shares ENABLE ROW LEVEL SECURITY;

-- STEP 3: Drop existing collection policies
-- ============================================================
DROP POLICY IF EXISTS "Users can view own collections" ON collections;
DROP POLICY IF EXISTS "Users can manage own collections" ON collections;
DROP POLICY IF EXISTS "Users can view own collection movies" ON collection_movies;
DROP POLICY IF EXISTS "Users can manage own collection movies" ON collection_movies;
DROP POLICY IF EXISTS "Allow all" ON collections;
DROP POLICY IF EXISTS "Allow all" ON collection_movies;

-- STEP 4: Create new collection policies with sharing support
-- ============================================================

-- Collections: Can view if you own it OR it's shared with you
CREATE POLICY "Users can view accessible collections" ON collections
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collection_shares cs
      JOIN users u ON u.id = cs.shared_with_user_id
      WHERE cs.collection_id = collections.id
      AND u.auth_id = auth.uid()
    )
  );

-- Collections: Can insert if authenticated
CREATE POLICY "Users can create collections" ON collections
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Collections: Can update/delete only if you own it
CREATE POLICY "Users can manage own collections" ON collections
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own collections" ON collections
  FOR DELETE USING (user_id = auth.uid());

-- STEP 5: Create collection_movies policies with sharing support
-- ============================================================

-- Can view collection movies if you can view the collection
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
  );

-- Can add movies if you own the collection OR have edit permission
CREATE POLICY "Users can add to accessible collections" ON collection_movies
  FOR INSERT WITH CHECK (
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
          AND cs.can_edit = true
        )
      )
    )
  );

-- Can remove movies if you own the collection OR have edit permission
CREATE POLICY "Users can remove from accessible collections" ON collection_movies
  FOR DELETE USING (
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
          AND cs.can_edit = true
        )
      )
    )
  );

-- STEP 6: Create collection_shares policies
-- ============================================================

-- Can view shares for collections you own or are shared with you
CREATE POLICY "Users can view collection shares" ON collection_shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_shares.collection_id
      AND c.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = collection_shares.shared_with_user_id
      AND u.auth_id = auth.uid()
    )
  );

-- Only collection owner can manage shares
CREATE POLICY "Owners can manage collection shares" ON collection_shares
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_shares.collection_id
      AND c.user_id = auth.uid()
    )
  );

-- ============================================================
-- STEP 7: Fix existing collections without user_id
-- ============================================================
-- Run this AFTER the above, replacing YOUR_AUTH_ID with your actual auth user ID
-- You can find your auth ID by running: SELECT id FROM auth.users WHERE email = 'your@email.com';
--
-- UPDATE collections SET user_id = 'YOUR_AUTH_ID' WHERE user_id IS NULL;
-- ============================================================
