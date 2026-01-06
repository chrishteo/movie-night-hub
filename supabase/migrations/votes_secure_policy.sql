-- Secure RLS policies for votes table
-- Properly enforces: vote as yourself + session participation required

-- Drop all existing votes policies
DROP POLICY IF EXISTS "Anyone can view votes" ON votes;
DROP POLICY IF EXISTS "Users can manage own votes" ON votes;
DROP POLICY IF EXISTS "Users can insert votes" ON votes;
DROP POLICY IF EXISTS "Users can update own votes" ON votes;
DROP POLICY IF EXISTS "Users can delete own votes" ON votes;

-- SELECT: Authenticated users can view all votes (needed for vote tallies)
CREATE POLICY "Authenticated users can view votes" ON votes
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Must vote as yourself AND be a session participant (if session vote)
-- This ensures:
-- 1. user_id MUST match auth.uid() (cannot vote as someone else)
-- 2. For session votes: you must be an accepted participant
CREATE POLICY "Users can insert own votes" ON votes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Must always vote as yourself
    user_id = auth.uid()
    AND (
      -- Either non-session vote (legacy support)
      session_id IS NULL
      OR
      -- Or you're an accepted participant in the session
      EXISTS (
        SELECT 1 FROM voting_session_participants vsp
        WHERE vsp.session_id = votes.session_id
        AND vsp.user_id = auth.uid()
        AND vsp.status = 'accepted'
      )
    )
  );

-- UPDATE: Can only update your own votes
CREATE POLICY "Users can update own votes" ON votes
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Can only delete your own votes
CREATE POLICY "Users can delete own votes" ON votes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
