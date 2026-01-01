import { createClient } from '@supabase/supabase-js'

// Create Supabase client for server-side auth verification
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Verify the user's auth token from the request
 * Returns the user object if valid, null otherwise
 *
 * For public endpoints that don't require auth, this is optional
 * For protected endpoints, check if user is null and return 401
 */
export async function verifyAuth(req) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.split(' ')[1]

  if (!token) {
    return null
  }

  // If we don't have the service role key, we can't verify tokens server-side
  // In this case, we'll rely on RLS policies in the database
  if (!supabaseServiceKey || !supabaseUrl) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY not configured - cannot verify auth server-side')
    return null
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return null
    }

    return user
  } catch (err) {
    console.error('Auth verification error:', err)
    return null
  }
}

/**
 * Middleware to require authentication
 * Returns 401 if not authenticated
 */
export function requireAuth(handler) {
  return async (req, res) => {
    const user = await verifyAuth(req)

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // Attach user to request for use in handler
    req.user = user

    return handler(req, res)
  }
}
