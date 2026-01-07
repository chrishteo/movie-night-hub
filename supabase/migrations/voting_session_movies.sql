-- Migration: Add movie picks to voting sessions
-- Each participant selects a configurable number of movies to include in voting

-- Add movies_per_user column to voting_sessions
ALTER TABLE voting_sessions ADD COLUMN IF NOT EXISTS movies_per_user INTEGER NOT NULL DEFAULT 5;

-- Create voting_session_movies table
CREATE TABLE IF NOT EXISTS voting_session_movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES voting_sessions(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  selected_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, movie_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_session_movies_session ON voting_session_movies(session_id);
CREATE INDEX IF NOT EXISTS idx_session_movies_user ON voting_session_movies(selected_by);

-- Enable RLS
ALTER TABLE voting_session_movies ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Anyone authenticated can view session movies
CREATE POLICY "select_session_movies" ON voting_session_movies
  FOR SELECT TO authenticated USING (true);

-- Accepted participants can add movies (must be their own selection)
CREATE POLICY "insert_session_movies" ON voting_session_movies
  FOR INSERT TO authenticated
  WITH CHECK (
    selected_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM voting_session_participants
      WHERE session_id = voting_session_movies.session_id
      AND user_id = auth.uid()
      AND status = 'accepted'
    )
  );

-- Users can delete their own selections
CREATE POLICY "delete_session_movies" ON voting_session_movies
  FOR DELETE TO authenticated
  USING (selected_by = auth.uid());

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE voting_session_movies;
