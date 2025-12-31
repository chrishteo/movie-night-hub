-- Migration: Add trailer, TMDB rating, and cast columns
-- Run this in your Supabase SQL Editor

ALTER TABLE movies ADD COLUMN IF NOT EXISTS trailer_url TEXT;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS tmdb_rating DECIMAL(3,1);
ALTER TABLE movies ADD COLUMN IF NOT EXISTS cast TEXT[];
