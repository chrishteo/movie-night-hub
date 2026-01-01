-- ============================================================
-- MOVIE NIGHT HUB - SECURITY MIGRATION
-- ============================================================
-- Run this script in Supabase SQL Editor (Database > SQL Editor)
-- This adds proper Row Level Security (RLS) to protect user data
-- ============================================================

-- STEP 1: Add user_id columns to link records to authenticated users
-- ============================================================

-- Add user_id to movies table (the user who added the movie)
ALTER TABLE movies
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add user_id to votes table (the user who cast the vote)
ALTER TABLE votes
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to collections table (the user who owns the collection)
ALTER TABLE collections
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to movie_nights table (the user who created the event)
ALTER TABLE movie_nights
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- STEP 2: Create indexes and constraints
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_movies_user_id ON movies(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_movie_nights_user_id ON movie_nights(user_id);

-- Add unique constraint for votes by user_id (one vote per user per movie)
-- First drop old constraint if it exists, then create new one
DO $$
BEGIN
  -- Try to create the constraint (will fail silently if exists)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'votes_movie_user_unique'
  ) THEN
    ALTER TABLE votes ADD CONSTRAINT votes_movie_user_unique UNIQUE (movie_id, user_id);
  END IF;
END $$;

-- STEP 3: Enable RLS on all tables (if not already enabled)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_of_the_week ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_nights ENABLE ROW LEVEL SECURITY;

-- STEP 4: Drop existing permissive policies
-- ============================================================
DROP POLICY IF EXISTS "Allow all" ON users;
DROP POLICY IF EXISTS "Allow all" ON movies;
DROP POLICY IF EXISTS "Allow all" ON votes;
DROP POLICY IF EXISTS "Allow all" ON collections;
DROP POLICY IF EXISTS "Allow all" ON collection_movies;
DROP POLICY IF EXISTS "Allow all" ON movie_of_the_week;
DROP POLICY IF EXISTS "Allow all" ON movie_nights;

-- Also drop any policies we might create (for idempotency)
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can create profile" ON users;
DROP POLICY IF EXISTS "Anyone can view movies" ON movies;
DROP POLICY IF EXISTS "Authenticated users can add movies" ON movies;
DROP POLICY IF EXISTS "Users can update own movies" ON movies;
DROP POLICY IF EXISTS "Users can delete own movies" ON movies;
DROP POLICY IF EXISTS "Anyone can view votes" ON votes;
DROP POLICY IF EXISTS "Users can manage own votes" ON votes;
DROP POLICY IF EXISTS "Users can view own collections" ON collections;
DROP POLICY IF EXISTS "Users can manage own collections" ON collections;
DROP POLICY IF EXISTS "Users can view own collection movies" ON collection_movies;
DROP POLICY IF EXISTS "Users can manage own collection movies" ON collection_movies;
DROP POLICY IF EXISTS "Anyone can view movie of the week" ON movie_of_the_week;
DROP POLICY IF EXISTS "Authenticated users can add movie of the week" ON movie_of_the_week;
DROP POLICY IF EXISTS "Anyone can view movie nights" ON movie_nights;
DROP POLICY IF EXISTS "Authenticated users can create movie nights" ON movie_nights;
DROP POLICY IF EXISTS "Users can manage own movie nights" ON movie_nights;

-- STEP 5: Create secure RLS policies
-- ============================================================

-- USERS TABLE POLICIES
-- Everyone can see user profiles (for displaying names/avatars)
CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT USING (true);

-- Users can only update their own profile (linked by auth_id)
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth_id = auth.uid());

-- Authenticated users can create a profile
CREATE POLICY "Users can create profile" ON users
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- MOVIES TABLE POLICIES
-- Everyone can view all movies (shared watchlist)
CREATE POLICY "Anyone can view movies" ON movies
  FOR SELECT USING (true);

-- Only authenticated users can add movies
CREATE POLICY "Authenticated users can add movies" ON movies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can only update movies they added
CREATE POLICY "Users can update own movies" ON movies
  FOR UPDATE USING (user_id = auth.uid());

-- Users can only delete movies they added
CREATE POLICY "Users can delete own movies" ON movies
  FOR DELETE USING (user_id = auth.uid());

-- VOTES TABLE POLICIES
-- Everyone can see votes (for vote tallies)
CREATE POLICY "Anyone can view votes" ON votes
  FOR SELECT USING (true);

-- Users can only create/update/delete their own votes
CREATE POLICY "Users can manage own votes" ON votes
  FOR ALL USING (user_id = auth.uid());

-- COLLECTIONS TABLE POLICIES
-- Users can only see their own collections (private collections)
CREATE POLICY "Users can view own collections" ON collections
  FOR SELECT USING (user_id = auth.uid());

-- Users can manage their own collections
CREATE POLICY "Users can manage own collections" ON collections
  FOR ALL USING (user_id = auth.uid());

-- COLLECTION_MOVIES TABLE POLICIES
-- Users can view movies in their own collections
CREATE POLICY "Users can view own collection movies" ON collection_movies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_movies.collection_id
      AND collections.user_id = auth.uid()
    )
  );

-- Users can manage movies in their own collections
CREATE POLICY "Users can manage own collection movies" ON collection_movies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_movies.collection_id
      AND collections.user_id = auth.uid()
    )
  );

-- MOVIE_OF_THE_WEEK TABLE POLICIES
-- Everyone can view movie of the week history
CREATE POLICY "Anyone can view movie of the week" ON movie_of_the_week
  FOR SELECT USING (true);

-- Only authenticated users can add movie of the week
CREATE POLICY "Authenticated users can add movie of the week" ON movie_of_the_week
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- MOVIE_NIGHTS TABLE POLICIES
-- Everyone can view scheduled movie nights
CREATE POLICY "Anyone can view movie nights" ON movie_nights
  FOR SELECT USING (true);

-- Authenticated users can create movie nights
CREATE POLICY "Authenticated users can create movie nights" ON movie_nights
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can only update/delete their own movie nights
CREATE POLICY "Users can manage own movie nights" ON movie_nights
  FOR UPDATE USING (user_id = auth.uid());

-- STEP 6: Create helper function to get current user's profile
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_profile()
RETURNS TABLE (id UUID, name TEXT, avatar TEXT, auth_id UUID)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.avatar, u.auth_id
  FROM users u
  WHERE u.auth_id = auth.uid();
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- MIGRATION COMPLETE!
-- ============================================================
-- After running this script:
-- 1. Existing movies/votes won't have user_id set (they'll be "orphaned")
-- 2. You can optionally link existing data by running:
--    UPDATE movies SET user_id = (SELECT auth_id FROM users WHERE name = movies.added_by LIMIT 1);
-- 3. New data will automatically be secured by RLS
-- ============================================================
