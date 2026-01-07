-- Add admin delete policy for voting sessions
-- Allows users with is_admin=true to delete any voting session

-- Drop the existing creator-only delete policy if it exists
DROP POLICY IF EXISTS "Creator can delete their sessions" ON voting_sessions;

-- Create a combined policy: creator OR admin can delete
CREATE POLICY "Creator or admin can delete sessions"
  ON voting_sessions FOR DELETE
  TO authenticated
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Also add admin policy for session participants (for cascade cleanup)
DROP POLICY IF EXISTS "Session creator can remove participants" ON voting_session_participants;

CREATE POLICY "Creator or admin can remove participants"
  ON voting_session_participants FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM voting_sessions
      WHERE voting_sessions.id = voting_session_participants.session_id
      AND (
        voting_sessions.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users
          WHERE users.auth_id = auth.uid()
          AND users.is_admin = true
        )
      )
    )
  );
