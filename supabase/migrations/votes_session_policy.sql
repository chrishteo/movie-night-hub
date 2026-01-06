-- Fix votes RLS policy for session-based voting
-- The existing policy is too restrictive for session voting

-- Drop existing votes policies
DROP POLICY IF EXISTS "Anyone can view votes" ON votes;
DROP POLICY IF EXISTS "Users can manage own votes" ON votes;

-- Recreate view policy
CREATE POLICY "Anyone can view votes" ON votes
  FOR SELECT USING (true);

-- Policy for inserting votes:
-- Allow if user is authenticated AND either:
-- 1. user_id matches auth.uid() (own vote), OR
-- 2. For session votes: user is a participant in the session
CREATE POLICY "Users can insert votes" ON votes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR (
      session_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM voting_session_participants
        WHERE session_id = votes.session_id
        AND user_id = auth.uid()
        AND status = 'accepted'
      )
    )
  );

-- Policy for updating votes
CREATE POLICY "Users can update own votes" ON votes
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Policy for deleting votes
CREATE POLICY "Users can delete own votes" ON votes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Also update unique constraint for session votes
-- First, check and drop old constraint if needed
DO $$
BEGIN
  -- Drop old constraint if exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'votes_movie_user_unique'
  ) THEN
    ALTER TABLE votes DROP CONSTRAINT votes_movie_user_unique;
  END IF;
END $$;

-- Create new unique constraint that includes session_id
-- This allows same user to vote on same movie in different sessions
ALTER TABLE votes ADD CONSTRAINT votes_movie_user_session_unique
  UNIQUE (movie_id, user_name, session_id);
