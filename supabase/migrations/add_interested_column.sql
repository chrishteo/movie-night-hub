-- Add interested column for "Not Interested" feature
-- Default to true for backwards compatibility (existing acknowledged movies are considered interested)
ALTER TABLE user_movie_status
ADD COLUMN IF NOT EXISTS interested BOOLEAN DEFAULT true;

-- Existing acknowledged movies (that aren't watched) should be considered interested
-- No update needed since default is true
