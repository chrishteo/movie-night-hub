-- Migration: Allow participants to auto-close sessions when no active participants remain
-- This policy allows any participant to update a session to 'cancelled' status
-- when there are no other accepted/invited participants (excluding the creator)

-- First, drop the existing update policy
DROP POLICY IF EXISTS "Creator can update their sessions" ON voting_sessions;

-- Create a new update policy that allows:
-- 1. Creator can always update their sessions
-- 2. Any participant can update status to 'cancelled' when no active non-creator participants exist
CREATE POLICY "Creator or auto-close can update sessions"
  ON voting_sessions FOR UPDATE
  TO authenticated
  USING (
    -- Creator can always update
    auth.uid() = created_by
    OR
    -- Any authenticated user can update if:
    -- They are a participant AND no active non-creator participants remain
    (
      EXISTS (
        SELECT 1 FROM voting_session_participants
        WHERE session_id = id AND user_id = auth.uid()
      )
      AND NOT EXISTS (
        SELECT 1 FROM voting_session_participants
        WHERE session_id = id
          AND user_id != created_by
          AND status IN ('accepted', 'invited')
      )
    )
  );
