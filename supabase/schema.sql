-- Movie Night Hub Database Schema
-- Run this in your Supabase SQL Editor

-- Users table (simple, no auth)
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Movies table
CREATE TABLE movies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  director TEXT,
  year INTEGER,
  genre TEXT,
  mood TEXT,
  rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  poster TEXT,
  streaming TEXT[], -- Array of streaming services
  watched BOOLEAN DEFAULT FALSE,
  watched_at TIMESTAMP WITH TIME ZONE,
  favorite BOOLEAN DEFAULT FALSE,
  notes TEXT,
  added_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes table
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  vote TEXT CHECK (vote IN ('yes', 'no')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(movie_id, user_name)
);

-- Movie of the Week table
CREATE TABLE movie_of_the_week (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id UUID REFERENCES movies(id) ON DELETE SET NULL,
  movie_title TEXT NOT NULL,
  movie_poster TEXT,
  picked_by TEXT NOT NULL,
  picked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (but allow all for now since no auth)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_of_the_week ENABLE ROW LEVEL SECURITY;

-- Policies to allow all operations (no auth)
CREATE POLICY "Allow all" ON users FOR ALL USING (true);
CREATE POLICY "Allow all" ON movies FOR ALL USING (true);
CREATE POLICY "Allow all" ON votes FOR ALL USING (true);
CREATE POLICY "Allow all" ON movie_of_the_week FOR ALL USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to movies table
CREATE TRIGGER update_movies_updated_at
    BEFORE UPDATE ON movies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default users
INSERT INTO users (name) VALUES ('Chris'), ('Maria'), ('Alex');

-- Insert sample movies (optional - you can skip this)
INSERT INTO movies (title, director, year, genre, mood, rating, poster, streaming, watched, watched_at, favorite, notes, added_by) VALUES
  ('Inception', 'Christopher Nolan', 2010, 'Sci-Fi', 'Intense', 5, 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg', ARRAY['Netflix'], true, NOW() - INTERVAL '7 days', true, 'Mind-bending!', 'Chris'),
  ('The Grand Budapest Hotel', 'Wes Anderson', 2014, 'Comedy', 'Fun', 4, 'https://m.media-amazon.com/images/M/MV5BMzM5NjUxOTEyMl5BMl5BanBnXkFtZTgwNjEyMDM0MDE@._V1_SX300.jpg', ARRAY['Amazon Prime'], false, NULL, false, '', 'Maria'),
  ('Parasite', 'Bong Joon-ho', 2019, 'Thriller', 'Intense', 5, 'https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_SX300.jpg', ARRAY['Hulu'], false, NULL, true, 'Oscar winner!', 'Chris');
