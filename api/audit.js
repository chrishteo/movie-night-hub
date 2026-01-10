import { verifyAuth } from './auth-verify.js'
import { logAudit, AuditActions } from './audit-log.js'

/**
 * API endpoint to log audit events from the frontend
 * Only authenticated users can log, and we verify the user matches
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify authentication
  const user = await verifyAuth(req)
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const { action, targetType, targetId, targetName, details } = req.body

  if (!action) {
    return res.status(400).json({ error: 'Action is required' })
  }

  // Validate action is a known type
  const validActions = Object.values(AuditActions)
  if (!validActions.includes(action)) {
    return res.status(400).json({ error: 'Invalid action type' })
  }

  // Log the audit event
  const result = await logAudit({
    userId: user.id,
    userEmail: user.email,
    action,
    targetType,
    targetId,
    targetName,
    details,
    req
  })

  if (!result.success) {
    return res.status(500).json({ error: 'Failed to log audit event' })
  }

  return res.status(200).json({ success: true })
}
