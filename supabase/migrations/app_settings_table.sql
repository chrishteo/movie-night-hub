-- App settings table for storing configuration values
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read settings
CREATE POLICY "Anyone can read app settings"
  ON app_settings FOR SELECT
  TO authenticated
  USING (true);

-- Only allow updates via service role (admin)
-- No insert/update/delete policies for regular users

-- Insert the initial version
INSERT INTO app_settings (key, value)
VALUES ('latest_version', '1.10.3')
ON CONFLICT (key) DO UPDATE SET value = '1.10.3', updated_at = NOW();
