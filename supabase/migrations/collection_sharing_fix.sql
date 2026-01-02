-- ============================================================
-- COLLECTION SHARING FIX - Run this to fix infinite recursion
-- ============================================================
-- This fixes the circular reference between collections and collection_shares policies

-- STEP 1: Drop the problematic policies
-- ============================================================
DROP POLICY IF EXISTS "Users can view accessible collections" ON collections;
DROP POLICY IF EXISTS "Users can create collections" ON collections;
DROP POLICY IF EXISTS "Users can manage own collections" ON collections;
DROP POLICY IF EXISTS "Users can delete own collections" ON collections;
DROP POLICY IF EXISTS "Users can view accessible collection movies" ON collection_movies;
DROP POLICY IF EXISTS "Users can add to accessible collections" ON collection_movies;
DROP POLICY IF EXISTS "Users can remove from accessible collections" ON collection_movies;
DROP POLICY IF EXISTS "Users can view collection shares" ON collection_shares;
DROP POLICY IF EXISTS "Owners can manage collection shares" ON collection_shares;

-- STEP 2: Add owner_id to collection_shares (denormalized for performance)
-- ============================================================
ALTER TABLE collection_shares ADD COLUMN IF NOT EXISTS owner_id UUID;

-- Populate owner_id from existing shares
UPDATE collection_shares cs
SET owner_id = c.user_id
FROM collections c
WHERE cs.collection_id = c.id AND cs.owner_id IS NULL;

-- STEP 3: Create helper function to get user's internal ID from auth ID
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_id_from_auth()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$;

-- STEP 4: Create collection_shares policies FIRST (no circular reference)
-- ============================================================

-- Users can see shares where they are the recipient OR they own the collection
CREATE POLICY "Users can view own shares" ON collection_shares
  FOR SELECT USING (
    owner_id = auth.uid()
    OR shared_with_user_id = get_user_id_from_auth()
  );

-- Only owner can insert/update/delete shares
CREATE POLICY "Owners can manage shares" ON collection_shares
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update shares" ON collection_shares
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete shares" ON collection_shares
  FOR DELETE USING (owner_id = auth.uid());

-- STEP 5: Create collections policies
-- ============================================================

-- Can view if you own it OR you're in the shares (using denormalized check)
CREATE POLICY "Users can view accessible collections" ON collections
  FOR SELECT USING (
    user_id = auth.uid()
    OR id IN (
      SELECT collection_id FROM collection_shares
      WHERE shared_with_user_id = get_user_id_from_auth()
    )
  );

-- Can insert if authenticated
CREATE POLICY "Users can create collections" ON collections
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Can update only if you own it
CREATE POLICY "Users can manage own collections" ON collections
  FOR UPDATE USING (user_id = auth.uid());

-- Can delete only if you own it
CREATE POLICY "Users can delete own collections" ON collections
  FOR DELETE USING (user_id = auth.uid());

-- STEP 6: Create collection_movies policies
-- ============================================================

-- Can view if you can access the collection
CREATE POLICY "Users can view accessible collection movies" ON collection_movies
  FOR SELECT USING (
    collection_id IN (
      SELECT id FROM collections WHERE user_id = auth.uid()
    )
    OR collection_id IN (
      SELECT collection_id FROM collection_shares
      WHERE shared_with_user_id = get_user_id_from_auth()
    )
  );

-- Can add if you own OR have edit permission
CREATE POLICY "Users can add to accessible collections" ON collection_movies
  FOR INSERT WITH CHECK (
    collection_id IN (
      SELECT id FROM collections WHERE user_id = auth.uid()
    )
    OR collection_id IN (
      SELECT collection_id FROM collection_shares
      WHERE shared_with_user_id = get_user_id_from_auth()
      AND can_edit = true
    )
  );

-- Can remove if you own OR have edit permission
CREATE POLICY "Users can remove from accessible collections" ON collection_movies
  FOR DELETE USING (
    collection_id IN (
      SELECT id FROM collections WHERE user_id = auth.uid()
    )
    OR collection_id IN (
      SELECT collection_id FROM collection_shares
      WHERE shared_with_user_id = get_user_id_from_auth()
      AND can_edit = true
    )
  );

-- ============================================================
-- Done! The recursion is fixed by:
-- 1. Adding owner_id to collection_shares (avoids looking up collections)
-- 2. Using get_user_id_from_auth() function (SECURITY DEFINER bypasses RLS)
-- 3. Using IN subqueries instead of EXISTS with joins
-- ============================================================
