-- Migration v2: Simpler policy - allow any participant to update sessions
-- This is more permissive but ensures auto-close works

-- First, drop existing update policies
DROP POLICY IF EXISTS "Creator can update their sessions" ON voting_sessions;
DROP POLICY IF EXISTS "Creator or auto-close can update sessions" ON voting_sessions;

-- Create a simpler policy: any participant can update the session
CREATE POLICY "Participants can update sessions"
  ON voting_sessions FOR UPDATE
  TO authenticated
  USING (
    -- Creator can always update
    auth.uid() = created_by
    OR
    -- Any participant can update
    EXISTS (
      SELECT 1 FROM voting_session_participants
      WHERE session_id = voting_sessions.id
      AND user_id = auth.uid()
    )
  );
