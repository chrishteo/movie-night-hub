-- ============================================================
-- WATCH INVITES MIGRATION
-- ============================================================
-- Allows users to invite others to mark movies as watched
-- RLS-compliant: users can only mark THEMSELVES as watched
-- ============================================================

-- STEP 1: Create watch_invites table
CREATE TABLE IF NOT EXISTS watch_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Prevent duplicate invites for same movie/invitee combo
  UNIQUE(movie_id, invitee_id)
);

-- STEP 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_watch_invites_movie_id ON watch_invites(movie_id);
CREATE INDEX IF NOT EXISTS idx_watch_invites_inviter_id ON watch_invites(inviter_id);
CREATE INDEX IF NOT EXISTS idx_watch_invites_invitee_id ON watch_invites(invitee_id);
CREATE INDEX IF NOT EXISTS idx_watch_invites_pending ON watch_invites(invitee_id, status) WHERE status = 'pending';

-- STEP 3: Enable RLS
ALTER TABLE watch_invites ENABLE ROW LEVEL SECURITY;

-- STEP 4: RLS Policies

-- Anyone authenticated can view invites they sent or received
CREATE POLICY "Users can view their invites" ON watch_invites
  FOR SELECT USING (
    auth.uid() = inviter_id OR auth.uid() = invitee_id
  );

-- Users can only send invites as themselves (prevents spoofing)
CREATE POLICY "Users can send invites" ON watch_invites
  FOR INSERT WITH CHECK (
    auth.uid() = inviter_id
    AND auth.uid() != invitee_id  -- Can't invite yourself
  );

-- Only invitees can respond to their pending invites
CREATE POLICY "Invitees can respond to invites" ON watch_invites
  FOR UPDATE USING (
    auth.uid() = invitee_id
    AND status = 'pending'
  );

-- Inviters can cancel pending invites they sent
CREATE POLICY "Inviters can cancel pending invites" ON watch_invites
  FOR DELETE USING (
    auth.uid() = inviter_id
    AND status = 'pending'
  );

-- ============================================================
-- STEP 5: Enable real-time for watch_invites
-- Run this in the Supabase dashboard under Database > Replication:
-- ALTER PUBLICATION supabase_realtime ADD TABLE watch_invites;
-- ============================================================
