import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Log an action to the audit_logs table
 * Uses service role to bypass RLS
 */
export async function logAudit({
  userId,
  userEmail,
  action,
  targetType = null,
  targetId = null,
  targetName = null,
  details = {},
  req = null
}) {
  // Skip if service key not configured
  if (!supabaseServiceKey || !supabaseUrl) {
    return { success: false, error: 'Service key not configured' }
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Extract IP and user agent from request if available
    const ipAddress = req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim()
      || req?.headers?.['x-real-ip']
      || req?.connection?.remoteAddress
      || null

    const userAgent = req?.headers?.['user-agent'] || null

    const { error } = await supabase.from('audit_logs').insert({
      user_id: userId,
      user_email: userEmail,
      action,
      target_type: targetType,
      target_id: targetId,
      target_name: targetName,
      details,
      ip_address: ipAddress,
      user_agent: userAgent
    })

    if (error) {
      console.error('Audit log insert error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Audit log error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Action constants for consistency
 */
export const AuditActions = {
  // Admin actions
  ADMIN_GRANT: 'admin.grant',
  ADMIN_REVOKE: 'admin.revoke',

  // User actions
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',

  // Movie actions
  MOVIE_CREATE: 'movie.create',
  MOVIE_UPDATE: 'movie.update',
  MOVIE_DELETE: 'movie.delete',
  MOVIE_DELETE_OTHER: 'movie.delete.other',  // Admin deleting another user's movie

  // Collection actions
  COLLECTION_CREATE: 'collection.create',
  COLLECTION_DELETE: 'collection.delete',
  COLLECTION_SHARE: 'collection.share',

  // Voting actions
  VOTING_SESSION_CREATE: 'voting.session.create',
  VOTING_SESSION_CLOSE: 'voting.session.close',

  // Import/Export
  MOVIES_IMPORT: 'movies.import',
  MOVIES_EXPORT: 'movies.export',

  // Auth events
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_FAILED: 'auth.failed'
}
