-- Add scheduled_time column to movie_nights table
ALTER TABLE movie_nights ADD COLUMN IF NOT EXISTS scheduled_time TIME;

-- Update RLS policies to include the new column (existing policies should work, but let's ensure)
-- The existing policies on movie_nights already allow insert/update/select, so no changes needed
