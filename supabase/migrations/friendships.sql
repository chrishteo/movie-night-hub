-- Friendships Migration
-- Adds friend request system where users must mutually connect to see each other's movies

-- ============================================
-- 1. FRIEND REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(sender_id, receiver_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);

-- ============================================
-- 2. FRIENDSHIPS VIEW (bidirectional)
-- ============================================
-- If A sent request to B and it was accepted, both A→B and B→A are friendships
CREATE OR REPLACE VIEW friendships AS
SELECT sender_id AS user_id, receiver_id AS friend_id, created_at
FROM friend_requests WHERE status = 'accepted'
UNION ALL
SELECT receiver_id AS user_id, sender_id AS friend_id, created_at
FROM friend_requests WHERE status = 'accepted';

-- ============================================
-- 3. HELPER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION get_friend_ids(for_user_id UUID)
RETURNS UUID[] AS $$
  SELECT COALESCE(ARRAY_AGG(friend_id), ARRAY[]::UUID[])
  FROM friendships
  WHERE user_id = for_user_id
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Helper to get current user's app user id from auth
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
  SELECT id FROM users WHERE auth_id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================
-- 4. RLS POLICIES FOR FRIEND_REQUESTS
-- ============================================
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Users see requests they sent or received
CREATE POLICY "users_see_own_requests" ON friend_requests
FOR SELECT USING (
  sender_id = get_current_user_id()
  OR receiver_id = get_current_user_id()
);

-- Can send requests (not to self, not duplicate)
CREATE POLICY "users_can_send_requests" ON friend_requests
FOR INSERT WITH CHECK (
  sender_id = get_current_user_id()
  AND sender_id != receiver_id
);

-- Receiver can accept/reject pending requests
CREATE POLICY "receiver_can_respond" ON friend_requests
FOR UPDATE USING (
  receiver_id = get_current_user_id()
  AND status = 'pending'
) WITH CHECK (
  status IN ('accepted', 'rejected')
);

-- Sender can cancel pending, either party can unfriend (delete accepted)
CREATE POLICY "users_can_remove_requests" ON friend_requests
FOR DELETE USING (
  sender_id = get_current_user_id()
  OR receiver_id = get_current_user_id()
);

-- ============================================
-- 5. UPDATE MOVIES RLS POLICY
-- ============================================
-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view all movies" ON movies;

-- New policy: Only see own + friend movies + admin sees all
CREATE POLICY "users_see_friend_movies" ON movies
FOR SELECT USING (
  -- Own movies (user added this movie)
  added_by = (SELECT name FROM users WHERE auth_id = auth.uid())
  OR
  -- Admin sees all
  EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND is_admin = true)
  OR
  -- Friend's movies (movie was added by someone who is my friend)
  EXISTS (
    SELECT 1 FROM friendships f
    JOIN users u ON u.id = f.friend_id
    WHERE f.user_id = get_current_user_id()
    AND u.name = movies.added_by
  )
);

-- ============================================
-- 6. ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE friend_requests;

-- ============================================
-- 7. AUTO-FRIEND EXISTING USERS (ONE-TIME MIGRATION)
-- ============================================
-- Creates accepted friend requests between all existing users
-- Uses u1.id < u2.id to create only one direction (the view makes it bidirectional)
INSERT INTO friend_requests (sender_id, receiver_id, status, created_at, responded_at)
SELECT
  u1.id AS sender_id,
  u2.id AS receiver_id,
  'accepted' AS status,
  NOW() AS created_at,
  NOW() AS responded_at
FROM users u1
CROSS JOIN users u2
WHERE u1.id < u2.id
ON CONFLICT (sender_id, receiver_id) DO NOTHING;
