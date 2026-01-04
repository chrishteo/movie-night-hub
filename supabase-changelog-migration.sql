-- ============================================================
-- CHANGELOG TABLE MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================================

-- Create changelog table
CREATE TABLE IF NOT EXISTS changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT DEFAULT 'feature' CHECK (type IN ('feature', 'fix', 'improvement')),
  version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_changelog_type ON changelog(type);
CREATE INDEX IF NOT EXISTS idx_changelog_created_at ON changelog(created_at DESC);

-- Enable Row Level Security
ALTER TABLE changelog ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can view changelog entries
CREATE POLICY "Anyone can view changelog" ON changelog
  FOR SELECT USING (true);

-- Only admins can manage changelog (create, update, delete)
CREATE POLICY "Admins can manage changelog" ON changelog
  FOR ALL USING (is_admin());
