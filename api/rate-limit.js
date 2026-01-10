import { createClient } from '@supabase/supabase-js'

// Rate limit configuration per endpoint
const RATE_LIMITS = {
  'search-movie': { maxRequests: 10, windowMs: 60000 },    // 10 requests per minute
  'recommendations': { maxRequests: 5, windowMs: 60000 },  // 5 requests per minute
  'similar': { maxRequests: 10, windowMs: 60000 },         // 10 requests per minute
  'default': { maxRequests: 20, windowMs: 60000 }          // 20 requests per minute
}

// Create Supabase client for rate limiting
function getSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials for rate limiting')
    return null
  }

  return createClient(supabaseUrl, supabaseKey)
}

/**
 * Get identifier for rate limiting (user ID or IP)
 */
function getIdentifier(req, user) {
  // Prefer user ID if authenticated
  if (user?.id) {
    return `user:${user.id}`
  }

  // Fall back to IP address
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
             req.headers['x-real-ip'] ||
             req.socket?.remoteAddress ||
             'unknown'

  return `ip:${ip}`
}

/**
 * Check rate limit and update counter
 *
 * @param {Request} req - The request object
 * @param {string} endpoint - The endpoint name (e.g., 'search-movie')
 * @param {object} user - The authenticated user (optional)
 * @returns {object} { allowed: boolean, remaining: number, resetIn: number }
 */
export async function checkRateLimit(req, endpoint, user = null) {
  const supabase = getSupabaseClient()

  // If Supabase is not configured, allow the request (fail open)
  // This ensures the app still works if rate limiting isn't set up
  if (!supabase) {
    console.warn('Rate limiting disabled: Supabase not configured')
    return { allowed: true, remaining: 999, resetIn: 0 }
  }

  const identifier = getIdentifier(req, user)
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default
  const windowStart = new Date(Date.now() - config.windowMs)

  try {
    // Get current rate limit record
    const { data: existing, error: fetchError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows found (that's OK)
      console.error('Rate limit fetch error:', fetchError)
      return { allowed: true, remaining: config.maxRequests, resetIn: 0 }
    }

    const now = new Date()

    // If no record exists or window has expired, create/reset
    if (!existing || new Date(existing.window_start) < windowStart) {
      const { error: upsertError } = await supabase
        .from('rate_limits')
        .upsert({
          identifier,
          endpoint,
          request_count: 1,
          window_start: now.toISOString(),
          updated_at: now.toISOString()
        }, {
          onConflict: 'identifier,endpoint'
        })

      if (upsertError) {
        console.error('Rate limit upsert error:', upsertError)
      }

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetIn: config.windowMs
      }
    }

    // Window is still active - check count
    if (existing.request_count >= config.maxRequests) {
      // Rate limited!
      const resetIn = config.windowMs - (now - new Date(existing.window_start))

      return {
        allowed: false,
        remaining: 0,
        resetIn: Math.max(0, Math.ceil(resetIn / 1000)) // seconds
      }
    }

    // Increment counter
    const { error: updateError } = await supabase
      .from('rate_limits')
      .update({
        request_count: existing.request_count + 1,
        updated_at: now.toISOString()
      })
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)

    if (updateError) {
      console.error('Rate limit update error:', updateError)
    }

    return {
      allowed: true,
      remaining: config.maxRequests - existing.request_count - 1,
      resetIn: Math.ceil((config.windowMs - (now - new Date(existing.window_start))) / 1000)
    }

  } catch (err) {
    console.error('Rate limit check failed:', err)
    // Fail open - allow the request if rate limiting fails
    return { allowed: true, remaining: config.maxRequests, resetIn: 0 }
  }
}

/**
 * Send rate limit exceeded response
 */
export function rateLimitExceeded(res, resetIn) {
  res.setHeader('Retry-After', resetIn)
  res.setHeader('X-RateLimit-Remaining', '0')
  res.setHeader('X-RateLimit-Reset', resetIn)

  return res.status(429).json({
    error: 'Too many requests',
    message: `Rate limit exceeded. Please try again in ${resetIn} seconds.`,
    retryAfter: resetIn
  })
}
