-- Add acknowledged column to user_movie_status
-- Tracks whether user has reviewed a movie added by someone else

ALTER TABLE user_movie_status
ADD COLUMN IF NOT EXISTS acknowledged BOOLEAN DEFAULT FALSE;

-- Index for efficient querying of unacknowledged movies
CREATE INDEX IF NOT EXISTS idx_user_movie_status_acknowledged
ON user_movie_status(user_id, acknowledged)
WHERE acknowledged = FALSE;

-- Auto-acknowledge existing interactions (user already interacted = already knows about it)
UPDATE user_movie_status
SET acknowledged = true
WHERE watched = true OR rating > 0;

-- Auto-acknowledge movies users added themselves
-- This ensures users don't see their own movies as "new"
INSERT INTO user_movie_status (movie_id, user_id, acknowledged)
SELECT m.id, m.user_id, true
FROM movies m
WHERE m.user_id IS NOT NULL
ON CONFLICT (movie_id, user_id)
DO UPDATE SET acknowledged = true;
