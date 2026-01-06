-- Voting Sessions Migration
-- Adds support for multiple concurrent voting sessions

-- Create voting_sessions table
CREATE TABLE IF NOT EXISTS voting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  winner_movie_id UUID REFERENCES movies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Create voting_session_participants table
CREATE TABLE IF NOT EXISTS voting_session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES voting_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'declined')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(session_id, user_id)
);

-- Add session_id to votes table (nullable for backwards compatibility)
ALTER TABLE votes ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES voting_sessions(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_voting_sessions_status ON voting_sessions(status);
CREATE INDEX IF NOT EXISTS idx_voting_sessions_created_by ON voting_sessions(created_by);
CREATE INDEX IF NOT EXISTS idx_voting_session_participants_session ON voting_session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_voting_session_participants_user ON voting_session_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_voting_session_participants_status ON voting_session_participants(status);
CREATE INDEX IF NOT EXISTS idx_votes_session ON votes(session_id);

-- Enable RLS
ALTER TABLE voting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_session_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for voting_sessions
-- Anyone authenticated can view active sessions
CREATE POLICY "Anyone can view voting sessions"
  ON voting_sessions FOR SELECT
  TO authenticated
  USING (true);

-- Anyone authenticated can create sessions
CREATE POLICY "Anyone can create voting sessions"
  ON voting_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Creator can update their sessions
CREATE POLICY "Creator can update their sessions"
  ON voting_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Creator can delete their sessions
CREATE POLICY "Creator can delete their sessions"
  ON voting_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- RLS Policies for voting_session_participants
-- Anyone can view participants
CREATE POLICY "Anyone can view session participants"
  ON voting_session_participants FOR SELECT
  TO authenticated
  USING (true);

-- Session creator can add participants
CREATE POLICY "Session creator can add participants"
  ON voting_session_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM voting_sessions
      WHERE id = session_id AND created_by = auth.uid()
    )
  );

-- Participants can update their own status (accept/decline)
CREATE POLICY "Participants can update own status"
  ON voting_session_participants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Session creator can remove participants
CREATE POLICY "Session creator can remove participants"
  ON voting_session_participants FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM voting_sessions
      WHERE id = session_id AND created_by = auth.uid()
    )
  );

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE voting_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE voting_session_participants;
