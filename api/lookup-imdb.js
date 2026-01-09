import { verifyAuth } from './auth-verify.js'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const isDev = process.env.NODE_ENV !== 'production'

// Lookup movie by IMDB ID using TMDB's find endpoint
async function findByIMDB(imdbId) {
  if (!TMDB_API_KEY) {
    return { success: false, error: 'TMDB not configured' }
  }

  try {
    // TMDB's find endpoint can lookup by external ID
    const response = await fetch(
      `https://api.themoviedb.org/3/find/${imdbId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`
    )

    if (!response.ok) {
      return { success: false, error: 'TMDB lookup failed' }
    }

    const data = await response.json()

    // movie_results contains matches from the movie database
    if (data.movie_results && data.movie_results.length > 0) {
      const movie = data.movie_results[0]
      return {
        success: true,
        movie: {
          tmdb_id: movie.id,
          title: movie.title,
          original_title: movie.original_title,
          year: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null,
          poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
          tmdb_rating: movie.vote_average || null
        }
      }
    }

    return { success: false, error: 'Movie not found' }
  } catch (err) {
    console.error('TMDB find error:', err)
    return { success: false, error: 'Lookup failed' }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify authentication
  const user = await verifyAuth(req)
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { imdbIds } = req.body

  if (!Array.isArray(imdbIds) || imdbIds.length === 0) {
    return res.status(400).json({ error: 'imdbIds array is required' })
  }

  // Limit batch size to prevent abuse
  if (imdbIds.length > 50) {
    return res.status(400).json({ error: 'Maximum 50 movies per batch' })
  }

  // Process lookups in parallel with rate limiting
  const results = await Promise.all(
    imdbIds.map(async (imdbId) => {
      const result = await findByIMDB(imdbId)
      return {
        imdb_id: imdbId,
        ...result
      }
    })
  )

  return res.status(200).json({ results })
}
