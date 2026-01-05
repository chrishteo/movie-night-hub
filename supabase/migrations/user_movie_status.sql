-- User Movie Status Migration
-- Adds per-user watched/rating tracking for movies

-- ============================================
-- 1. Create user_movie_status table
-- ============================================
CREATE TABLE IF NOT EXISTS user_movie_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  watched BOOLEAN DEFAULT FALSE,
  watched_at TIMESTAMP WITH TIME ZONE,
  rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(movie_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_movie_status_movie_id ON user_movie_status(movie_id);
CREATE INDEX IF NOT EXISTS idx_user_movie_status_user_id ON user_movie_status(user_id);
CREATE INDEX IF NOT EXISTS idx_user_movie_status_watched ON user_movie_status(user_id, watched) WHERE watched = true;

-- Enable RLS
ALTER TABLE user_movie_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Note: Permissive policies for trusted family/friends app
-- Any authenticated user can manage statuses (enables movie night logging for others)
CREATE POLICY "Anyone can view all statuses" ON user_movie_status
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert status" ON user_movie_status
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update status" ON user_movie_status
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete status" ON user_movie_status
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Updated_at trigger (reuses existing function from schema.sql)
CREATE TRIGGER update_user_movie_status_updated_at
  BEFORE UPDATE ON user_movie_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. Add participants to movie_nights table
-- ============================================
ALTER TABLE movie_nights ADD COLUMN IF NOT EXISTS participants UUID[] DEFAULT '{}';
ALTER TABLE movie_nights ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE movie_nights ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;
ALTER TABLE movie_nights ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Index for finding user's movie nights
CREATE INDEX IF NOT EXISTS idx_movie_nights_user_id ON movie_nights(user_id);

-- ============================================
-- 3. Enable real-time for user_movie_status
-- ============================================
-- Run this in the Supabase dashboard under Database > Replication
-- to enable real-time updates for the new table:
-- ALTER PUBLICATION supabase_realtime ADD TABLE user_movie_status;
