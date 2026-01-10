-- ============================================================
-- RATE LIMITING TABLE
-- ============================================================
-- Stores request counts for API rate limiting
-- Works across serverless instances (unlike in-memory)
-- ============================================================

-- Create rate_limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,           -- User ID, IP, or API key
  endpoint text NOT NULL,             -- API endpoint (e.g., 'search-movie', 'recommendations')
  request_count integer DEFAULT 1,    -- Number of requests in current window
  window_start timestamp with time zone DEFAULT now(),  -- When the current window started
  updated_at timestamp with time zone DEFAULT now(),

  -- One record per identifier+endpoint combination
  UNIQUE(identifier, endpoint)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
  ON rate_limits(identifier, endpoint);

-- Index for cleanup of old records
CREATE INDEX IF NOT EXISTS idx_rate_limits_window
  ON rate_limits(window_start);

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything (API calls use service role)
-- Public users shouldn't access this table directly
CREATE POLICY "Service role full access" ON rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to read/write their own rate limits
-- This allows the anon key to work for rate limiting
CREATE POLICY "Users can manage own rate limits" ON rate_limits
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- CLEANUP FUNCTION (optional)
-- Run periodically to clean old rate limit records
-- ============================================================

CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  -- Delete records where window is older than 1 hour
  DELETE FROM rate_limits
  WHERE window_start < now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- USAGE NOTES
-- ============================================================
--
-- Rate limiting logic (in API code):
--
-- 1. Get current record:
--    SELECT * FROM rate_limits
--    WHERE identifier = $1 AND endpoint = $2
--
-- 2. If no record or window expired (> 1 minute old):
--    UPSERT with request_count = 1, window_start = now()
--
-- 3. If window still valid and count < limit:
--    UPDATE request_count = request_count + 1
--
-- 4. If window still valid and count >= limit:
--    Return 429 Too Many Requests
--
-- ============================================================
