-- ============================================================
-- MOVIE NIGHT HUB - DATABASE SCHEMA
-- Exported from Supabase: January 10, 2026
-- ============================================================

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE auth_id = auth.uid()
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user ID from auth ID
CREATE OR REPLACE FUNCTION get_user_id_from_auth()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT id FROM users WHERE auth_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TABLES
-- ============================================================

-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  avatar text,
  created_at timestamp with time zone DEFAULT now(),
  auth_id uuid UNIQUE,
  is_admin boolean DEFAULT false
);

-- Movies table
CREATE TABLE movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  director text,
  year integer,
  genre text,
  mood text,
  rating integer,
  poster text,
  notes text,
  streaming text[],
  watched boolean DEFAULT false,
  watched_at timestamp with time zone,
  favorite boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  added_by text NOT NULL,
  user_id uuid,
  tmdb_rating numeric,
  imdb_rating numeric,
  rotten_tomatoes integer,
  trailer_url text,
  cast text[]
);

-- Votes table
CREATE TABLE votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id uuid REFERENCES movies(id) ON DELETE CASCADE,
  user_id uuid,
  user_name text NOT NULL,
  vote text,
  session_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Announcements table
CREATE TABLE announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  active boolean DEFAULT true,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid
);

-- Bug reports table
CREATE TABLE bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  user_id uuid,
  user_name text,
  status text DEFAULT 'open',
  admin_notes text,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Changelog table
CREATE TABLE changelog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  type text DEFAULT 'feature',
  version text,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid
);

-- Collections table
CREATE TABLE collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  emoji text,
  color text,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Collection movies junction table
CREATE TABLE collection_movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid REFERENCES collections(id) ON DELETE CASCADE,
  movie_id uuid REFERENCES movies(id) ON DELETE CASCADE,
  added_at timestamp with time zone DEFAULT now()
);

-- Collection shares table
CREATE TABLE collection_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid REFERENCES collections(id) ON DELETE CASCADE,
  owner_id uuid,
  shared_with_user_id uuid,
  can_edit boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Movie nights table
CREATE TABLE movie_nights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id uuid REFERENCES movies(id) ON DELETE SET NULL,
  movie_title text NOT NULL,
  scheduled_date date NOT NULL,
  scheduled_time time without time zone,
  notes text,
  participants text[],
  user_id uuid,
  completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Movie of the week table
CREATE TABLE movie_of_the_week (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id uuid REFERENCES movies(id) ON DELETE SET NULL,
  movie_title text NOT NULL,
  movie_poster text,
  picked_by text NOT NULL,
  picked_at timestamp with time zone DEFAULT now()
);

-- User movie status (per-user watched/ratings)
CREATE TABLE user_movie_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id uuid NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  watched boolean DEFAULT false,
  watched_at timestamp with time zone,
  rating integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(movie_id, user_id)
);

-- Voting sessions table
CREATE TABLE voting_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  movies_per_user integer NOT NULL DEFAULT 5,
  created_by uuid,
  winner_movie_id uuid REFERENCES movies(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  ended_at timestamp with time zone
);

-- Voting session participants table
CREATE TABLE voting_session_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES voting_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  invited_at timestamp with time zone DEFAULT now(),
  responded_at timestamp with time zone
);

-- Voting session movies table
CREATE TABLE voting_session_movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES voting_sessions(id) ON DELETE CASCADE,
  movie_id uuid NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  selected_by uuid NOT NULL,
  selected_at timestamp with time zone DEFAULT now()
);

-- Watch invites table
CREATE TABLE watch_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id uuid NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL,
  invitee_id uuid NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  responded_at timestamp with time zone
);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE changelog ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_nights ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_of_the_week ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_movie_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_session_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_invites ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES: announcements
-- ============================================================

CREATE POLICY "Admins can manage announcements" ON announcements
  FOR ALL TO public
  USING (is_admin());

CREATE POLICY "Anyone can view active announcements" ON announcements
  FOR SELECT TO public
  USING ((active = true) AND ((expires_at IS NULL) OR (expires_at > now())));

-- ============================================================
-- RLS POLICIES: bug_reports
-- ============================================================

CREATE POLICY "Admins can delete bug reports" ON bug_reports
  FOR DELETE TO public
  USING (is_admin());

CREATE POLICY "Admins can update bug reports" ON bug_reports
  FOR UPDATE TO public
  USING (is_admin());

CREATE POLICY "Users can create bug reports" ON bug_reports
  FOR INSERT TO public
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own bug reports" ON bug_reports
  FOR SELECT TO public
  USING (
    (user_id IN (SELECT users.id FROM users WHERE users.auth_id = auth.uid()))
    OR is_admin()
  );

-- ============================================================
-- RLS POLICIES: changelog
-- ============================================================

CREATE POLICY "Admins can manage changelog" ON changelog
  FOR ALL TO public
  USING (is_admin());

CREATE POLICY "Anyone can view changelog" ON changelog
  FOR SELECT TO public
  USING (true);

-- ============================================================
-- RLS POLICIES: collection_movies
-- ============================================================

CREATE POLICY "Users can add to accessible collections" ON collection_movies
  FOR INSERT TO public
  WITH CHECK (
    (collection_id IN (SELECT collections.id FROM collections WHERE collections.user_id = auth.uid()))
    OR (collection_id IN (
      SELECT collection_shares.collection_id FROM collection_shares
      WHERE collection_shares.shared_with_user_id = get_user_id_from_auth()
      AND collection_shares.can_edit = true
    ))
  );

CREATE POLICY "Users can remove from accessible collections" ON collection_movies
  FOR DELETE TO public
  USING (
    (collection_id IN (SELECT collections.id FROM collections WHERE collections.user_id = auth.uid()))
    OR (collection_id IN (
      SELECT collection_shares.collection_id FROM collection_shares
      WHERE collection_shares.shared_with_user_id = get_user_id_from_auth()
      AND collection_shares.can_edit = true
    ))
  );

CREATE POLICY "Users can view accessible collection movies" ON collection_movies
  FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_movies.collection_id
      AND (
        c.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM collection_shares cs
          JOIN users u ON u.id = cs.shared_with_user_id
          WHERE cs.collection_id = c.id AND u.auth_id = auth.uid()
        )
      )
    )
    OR EXISTS (SELECT 1 FROM users WHERE users.auth_id = auth.uid() AND users.is_admin = true)
  );

-- ============================================================
-- RLS POLICIES: collection_shares
-- ============================================================

CREATE POLICY "Owners can delete shares" ON collection_shares
  FOR DELETE TO public
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can manage shares" ON collection_shares
  FOR INSERT TO public
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update shares" ON collection_shares
  FOR UPDATE TO public
  USING (owner_id = auth.uid());

CREATE POLICY "Users can view own shares" ON collection_shares
  FOR SELECT TO public
  USING ((owner_id = auth.uid()) OR (shared_with_user_id = get_user_id_from_auth()));

-- ============================================================
-- RLS POLICIES: collections
-- ============================================================

CREATE POLICY "Users can create collections" ON collections
  FOR INSERT TO public
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own collections" ON collections
  FOR DELETE TO public
  USING (
    (user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE users.auth_id = auth.uid() AND users.is_admin = true)
  );

CREATE POLICY "Users can manage own collections" ON collections
  FOR UPDATE TO public
  USING (user_id = auth.uid());

CREATE POLICY "Users can view accessible collections" ON collections
  FOR SELECT TO public
  USING (
    (user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM collection_shares cs
      JOIN users u ON u.id = cs.shared_with_user_id
      WHERE cs.collection_id = collections.id AND u.auth_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM users WHERE users.auth_id = auth.uid() AND users.is_admin = true)
  );

-- ============================================================
-- RLS POLICIES: movie_nights
-- ============================================================

CREATE POLICY "Admins can delete any movie night" ON movie_nights
  FOR DELETE TO public
  USING (EXISTS (SELECT 1 FROM users WHERE users.auth_id = auth.uid() AND users.is_admin = true));

CREATE POLICY "Admins can update any movie night" ON movie_nights
  FOR UPDATE TO public
  USING (EXISTS (SELECT 1 FROM users WHERE users.auth_id = auth.uid() AND users.is_admin = true));

CREATE POLICY "Anyone can view movie nights" ON movie_nights
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Authenticated users can create movie nights" ON movie_nights
  FOR INSERT TO public
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own movie nights" ON movie_nights
  FOR DELETE TO public
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own movie nights" ON movie_nights
  FOR UPDATE TO public
  USING (user_id = auth.uid());

-- ============================================================
-- RLS POLICIES: movie_of_the_week
-- ============================================================

CREATE POLICY "Anyone can view movie of the week" ON movie_of_the_week
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Authenticated users can add movie of the week" ON movie_of_the_week
  FOR INSERT TO public
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- RLS POLICIES: movies
-- ============================================================

CREATE POLICY "Anyone can view movies" ON movies
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Authenticated users can add movies" ON movies
  FOR INSERT TO public
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own movies" ON movies
  FOR DELETE TO public
  USING ((user_id = auth.uid()) OR is_admin());

CREATE POLICY "Users can update own movies" ON movies
  FOR UPDATE TO public
  USING ((user_id = auth.uid()) OR is_admin());

-- ============================================================
-- RLS POLICIES: user_movie_status
-- ============================================================

CREATE POLICY "Anyone can view all statuses" ON user_movie_status
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Users can delete own status" ON user_movie_status
  FOR DELETE TO public
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own status" ON user_movie_status
  FOR INSERT TO public
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own status" ON user_movie_status
  FOR UPDATE TO public
  USING (user_id = auth.uid());

-- ============================================================
-- RLS POLICIES: users
-- ============================================================

CREATE POLICY "Admins can delete users" ON users
  FOR DELETE TO public
  USING (
    is_admin()
    AND (id <> (SELECT users_1.id FROM users users_1 WHERE users_1.auth_id = auth.uid()))
  );

CREATE POLICY "Users can create profile" ON users
  FOR INSERT TO public
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO public
  USING (auth_id = auth.uid());

CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT TO public
  USING (true);

-- ============================================================
-- RLS POLICIES: votes
-- ============================================================

CREATE POLICY "Authenticated users can view votes" ON votes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can delete own votes" ON votes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own votes" ON votes
  FOR INSERT TO authenticated
  WITH CHECK (
    (user_id = auth.uid())
    AND (
      (session_id IS NULL)
      OR EXISTS (
        SELECT 1 FROM voting_session_participants vsp
        WHERE vsp.session_id = votes.session_id
        AND vsp.user_id = auth.uid()
        AND vsp.status = 'accepted'
      )
    )
  );

CREATE POLICY "Users can update own votes" ON votes
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- RLS POLICIES: voting_session_movies
-- ============================================================

CREATE POLICY "delete_session_movies" ON voting_session_movies
  FOR DELETE TO authenticated
  USING (selected_by = auth.uid());

CREATE POLICY "insert_session_movies" ON voting_session_movies
  FOR INSERT TO authenticated
  WITH CHECK (
    (selected_by = auth.uid())
    AND EXISTS (
      SELECT 1 FROM voting_session_participants
      WHERE voting_session_participants.session_id = voting_session_movies.session_id
      AND voting_session_participants.user_id = auth.uid()
      AND voting_session_participants.status = 'accepted'
    )
  );

CREATE POLICY "select_session_movies" ON voting_session_movies
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================
-- RLS POLICIES: voting_session_participants
-- ============================================================

CREATE POLICY "Anyone can view session participants" ON voting_session_participants
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Creator or admin can remove participants" ON voting_session_participants
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM voting_sessions
      WHERE voting_sessions.id = voting_session_participants.session_id
      AND (
        voting_sessions.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM users WHERE users.auth_id = auth.uid() AND users.is_admin = true)
      )
    )
  );

CREATE POLICY "Participants can update own status" ON voting_session_participants
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Session creator can add participants" ON voting_session_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM voting_sessions
      WHERE voting_sessions.id = voting_session_participants.session_id
      AND voting_sessions.created_by = auth.uid()
    )
  );

-- ============================================================
-- RLS POLICIES: voting_sessions
-- ============================================================

CREATE POLICY "Anyone can create voting sessions" ON voting_sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Anyone can view voting sessions" ON voting_sessions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Creator or admin can delete sessions" ON voting_sessions
  FOR DELETE TO authenticated
  USING (
    (auth.uid() = created_by)
    OR EXISTS (SELECT 1 FROM users WHERE users.auth_id = auth.uid() AND users.is_admin = true)
  );

CREATE POLICY "Session members can update sessions" ON voting_sessions
  FOR UPDATE TO authenticated
  USING (
    (created_by = auth.uid())
    OR EXISTS (
      SELECT 1 FROM voting_session_participants vsp
      WHERE vsp.session_id = voting_sessions.id
      AND vsp.user_id = auth.uid()
      AND vsp.status = 'accepted'
    )
  )
  WITH CHECK (
    (created_by = auth.uid())
    OR EXISTS (
      SELECT 1 FROM voting_session_participants vsp
      WHERE vsp.session_id = voting_sessions.id
      AND vsp.user_id = auth.uid()
      AND vsp.status = 'accepted'
    )
  );

-- ============================================================
-- RLS POLICIES: watch_invites
-- ============================================================

CREATE POLICY "Invitees can respond to invites" ON watch_invites
  FOR UPDATE TO public
  USING (auth.uid() = invitee_id)
  WITH CHECK (auth.uid() = invitee_id);

CREATE POLICY "Inviters can cancel pending invites" ON watch_invites
  FOR DELETE TO public
  USING ((auth.uid() = inviter_id) AND (status = 'pending'));

CREATE POLICY "Users can send invites" ON watch_invites
  FOR INSERT TO public
  WITH CHECK ((auth.uid() = inviter_id) AND (auth.uid() <> invitee_id));

CREATE POLICY "Users can view their invites" ON watch_invites
  FOR SELECT TO public
  USING ((auth.uid() = inviter_id) OR (auth.uid() = invitee_id));

-- ============================================================
-- INDEXES (for performance)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_movies_user_id ON movies(user_id);
CREATE INDEX IF NOT EXISTS idx_movies_added_by ON movies(added_by);
CREATE INDEX IF NOT EXISTS idx_votes_session_id ON votes(session_id);
CREATE INDEX IF NOT EXISTS idx_votes_movie_id ON votes(movie_id);
CREATE INDEX IF NOT EXISTS idx_collection_movies_collection_id ON collection_movies(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_movies_movie_id ON collection_movies(movie_id);
CREATE INDEX IF NOT EXISTS idx_user_movie_status_movie_id ON user_movie_status(movie_id);
CREATE INDEX IF NOT EXISTS idx_user_movie_status_user_id ON user_movie_status(user_id);
CREATE INDEX IF NOT EXISTS idx_voting_session_participants_session_id ON voting_session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_watch_invites_invitee_id ON watch_invites(invitee_id);

-- ============================================================
-- REALTIME SUBSCRIPTIONS
-- ============================================================

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE movies;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE user_movie_status;
ALTER PUBLICATION supabase_realtime ADD TABLE watch_invites;
ALTER PUBLICATION supabase_realtime ADD TABLE voting_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE voting_session_participants;
