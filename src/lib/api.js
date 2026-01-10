import { GENRES, MOODS, STREAMING } from '../utils/constants'
import { supabase } from './supabase'

// Get auth headers for API calls
async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  const headers = {
    'Content-Type': 'application/json'
  }
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }
  return headers
}

// Quick search TMDB for multiple results
export async function searchTMDB(query) {
  const headers = await getAuthHeaders()
  const response = await fetch('/api/search-tmdb', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to search movies')
  }

  return response.json()
}

export async function searchMovie(title, tmdbId = null) {
  const headers = await getAuthHeaders()
  const response = await fetch('/api/search-movie', {
    method: 'POST',
    headers,
    body: JSON.stringify({ title, tmdbId })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to search for movie')
  }

  const data = await response.json()

  // Return the data with AI status flags
  return {
    title: data.title || title,
    director: data.director || '',
    year: data.year || null,
    genre: GENRES.includes(data.genre) ? data.genre : '',
    mood: MOODS.includes(data.mood) ? data.mood : '',
    poster: data.poster || '',
    streaming: Array.isArray(data.streaming)
      ? data.streaming.filter(s => STREAMING.includes(s))
      : [],
    trailer_url: data.trailer_url || '',
    tmdb_rating: data.tmdb_rating || null,
    cast: Array.isArray(data.cast) ? data.cast : [],
    imdb_rating: data.imdb_rating || null,
    rotten_tomatoes: data.rotten_tomatoes || null,
    // AI status flags
    ai_pending: data.ai_pending || false,
    ai_unavailable: data.ai_unavailable || false,
    retry_after_seconds: data.retry_after_seconds || null
  }
}

// Request AI-only enrichment for a movie
export async function enrichMovieWithAI(title) {
  const headers = await getAuthHeaders()
  const response = await fetch('/api/search-movie', {
    method: 'POST',
    headers,
    body: JSON.stringify({ title, aiOnly: true })
  })

  if (!response.ok) {
    const error = await response.json()
    return {
      success: false,
      rateLimited: response.status === 429,
      retryAfterSeconds: error.retry_after_seconds || 60,
      data: null
    }
  }

  const data = await response.json()
  return {
    success: true,
    rateLimited: false,
    data: {
      genre: GENRES.includes(data.genre) ? data.genre : '',
      mood: MOODS.includes(data.mood) ? data.mood : '',
      streaming: Array.isArray(data.streaming)
        ? data.streaming.filter(s => STREAMING.includes(s))
        : []
    }
  }
}

// Check AI service availability
export async function checkAIStatus() {
  try {
    const response = await fetch('/api/ai-status')
    if (response.ok) {
      return await response.json()
    }
  } catch (err) {
    console.error('Failed to check AI status:', err)
  }
  return { ai_available: true, remaining_seconds: 0 }
}

// Lookup movies by IMDB IDs (for import)
export async function lookupIMDBMovies(imdbIds) {
  const headers = await getAuthHeaders()
  const response = await fetch('/api/lookup-imdb', {
    method: 'POST',
    headers,
    body: JSON.stringify({ imdbIds })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to lookup movies')
  }

  return response.json()
}

export async function getRecommendations(movies, seedMovie = null) {
  const headers = await getAuthHeaders()
  const response = await fetch('/api/recommendations', {
    method: 'POST',
    headers,
    body: JSON.stringify({ movies, seedMovie })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get recommendations')
  }

  const data = await response.json()

  // Validate and normalize the response
  return data.map(rec => ({
    title: rec.title || 'Unknown',
    director: rec.director || '',
    year: rec.year || null,
    genre: GENRES.includes(rec.genre) ? rec.genre : '',
    mood: MOODS.includes(rec.mood) ? rec.mood : '',
    reason: rec.reason || '',
    poster: rec.poster || '',
    streaming: Array.isArray(rec.streaming)
      ? rec.streaming.filter(s => STREAMING.includes(s))
      : []
  }))
}

// Audit logging - fire and forget, don't block UI
export const AuditActions = {
  ADMIN_GRANT: 'admin.grant',
  ADMIN_REVOKE: 'admin.revoke',
  USER_UPDATE: 'user.update',
  MOVIE_DELETE: 'movie.delete',
  MOVIE_DELETE_OTHER: 'movie.delete.other',
  COLLECTION_DELETE: 'collection.delete',
  VOTING_SESSION_CREATE: 'voting.session.create',
  MOVIES_IMPORT: 'movies.import'
}

export async function logAudit(action, targetType = null, targetId = null, targetName = null, details = {}) {
  try {
    const headers = await getAuthHeaders()
    // Fire and forget - don't await or block
    fetch('/api/audit', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action, targetType, targetId, targetName, details })
    }).catch(() => {}) // Silently ignore errors
  } catch {
    // Silently ignore - audit logging should never break the app
  }
}
