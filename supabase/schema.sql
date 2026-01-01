-- Movie Night Hub Database Schema
-- Run this in your Supabase SQL Editor

-- Users table (linked to Supabase Auth)
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_id UUID UNIQUE, -- Links to Supabase Auth user
  name TEXT UNIQUE NOT NULL,
  avatar TEXT DEFAULT '😊',
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
  trailer_url TEXT,
  tmdb_rating DECIMAL(3,1),
  "cast" TEXT[], -- Array of actor names
  imdb_rating DECIMAL(3,1),
  rotten_tomatoes INTEGER,
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

-- Collections table
CREATE TABLE collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '📁',
  color TEXT DEFAULT 'purple',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collection-Movies junction table
CREATE TABLE collection_movies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_id, movie_id)
);

-- Movie Nights table
CREATE TABLE movie_nights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id UUID REFERENCES movies(id) ON DELETE SET NULL,
  movie_title TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (but allow all for now since no auth)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_of_the_week ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_nights ENABLE ROW LEVEL SECURITY;

-- Policies to allow all operations (no auth)
CREATE POLICY "Allow all" ON users FOR ALL USING (true);
CREATE POLICY "Allow all" ON movies FOR ALL USING (true);
CREATE POLICY "Allow all" ON votes FOR ALL USING (true);
CREATE POLICY "Allow all" ON movie_of_the_week FOR ALL USING (true);
CREATE POLICY "Allow all" ON collections FOR ALL USING (true);
CREATE POLICY "Allow all" ON collection_movies FOR ALL USING (true);
CREATE POLICY "Allow all" ON movie_nights FOR ALL USING (true);

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

-- Create indexes for common queries
CREATE INDEX idx_movies_genre ON movies(genre);
CREATE INDEX idx_movies_watched ON movies(watched);
CREATE INDEX idx_movies_added_by ON movies(added_by);
CREATE INDEX idx_votes_movie_id ON votes(movie_id);
CREATE INDEX idx_collection_movies_collection_id ON collection_movies(collection_id);
CREATE INDEX idx_collection_movies_movie_id ON collection_movies(movie_id);
CREATE INDEX idx_movie_nights_scheduled_date ON movie_nights(scheduled_date);

-- Insert default users (optional)
-- INSERT INTO users (name) VALUES ('Chris'), ('Maria'), ('Alex');
