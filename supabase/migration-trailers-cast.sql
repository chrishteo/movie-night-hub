-- Migration: Add trailer, ratings, and cast columns
-- Run this in your Supabase SQL Editor

ALTER TABLE movies ADD COLUMN IF NOT EXISTS trailer_url TEXT;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS tmdb_rating DECIMAL(3,1);
ALTER TABLE movies ADD COLUMN IF NOT EXISTS "cast" TEXT[];
ALTER TABLE movies ADD COLUMN IF NOT EXISTS imdb_rating DECIMAL(3,1);
ALTER TABLE movies ADD COLUMN IF NOT EXISTS rotten_tomatoes INTEGER;
