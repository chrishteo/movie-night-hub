// In-memory rate limit tracking (per serverless instance)
// This will be shared across requests within the same instance
let rateLimitState = {
  isLimited: false,
  limitedAt: null,
  cooldownMs: 60000, // 1 minute cooldown
  retryAfter: null
}

export function setRateLimited(retryAfterMs = null) {
  rateLimitState.isLimited = true
  rateLimitState.limitedAt = Date.now()
  if (retryAfterMs) {
    rateLimitState.cooldownMs = retryAfterMs
  }
  rateLimitState.retryAfter = Date.now() + rateLimitState.cooldownMs
}

export function clearRateLimit() {
  rateLimitState.isLimited = false
  rateLimitState.limitedAt = null
  rateLimitState.retryAfter = null
}

export function isRateLimited() {
  if (!rateLimitState.isLimited) return false

  // Check if cooldown has expired
  if (Date.now() > rateLimitState.retryAfter) {
    clearRateLimit()
    return false
  }

  return true
}

export function getRateLimitStatus() {
  const limited = isRateLimited()
  return {
    available: !limited,
    retryAfter: limited ? rateLimitState.retryAfter : null,
    remainingMs: limited ? Math.max(0, rateLimitState.retryAfter - Date.now()) : 0
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const status = getRateLimitStatus()

  return res.status(200).json({
    ai_available: status.available,
    retry_after: status.retryAfter,
    remaining_seconds: Math.ceil(status.remainingMs / 1000)
  })
}
