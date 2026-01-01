import { GENRES, MOODS, STREAMING } from '../shared/constants.js'
import { setRateLimited, isRateLimited, getRateLimitStatus } from './ai-status.js'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const OMDB_API_KEY = process.env.OMDB_API_KEY
const isDev = process.env.NODE_ENV !== 'production'

// Fetch IMDB and Rotten Tomatoes ratings from OMDB
async function getOMDBRatings(title, year) {
  if (!OMDB_API_KEY) {
    if (isDev) console.log('OMDB: No API key configured')
    return { imdb_rating: null, rotten_tomatoes: null }
  }

  try {
    const query = encodeURIComponent(title)
    const yearParam = year ? `&y=${year}` : ''
    const url = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${query}${yearParam}`

    const response = await fetch(url)

    if (!response.ok) {
      if (isDev) console.log('OMDB: Response not OK', response.status)
      return { imdb_rating: null, rotten_tomatoes: null }
    }

    const data = await response.json()

    if (data.Response === 'False') {
      if (isDev) console.log('OMDB: Movie not found -', data.Error)
      return { imdb_rating: null, rotten_tomatoes: null }
    }

    // Extract IMDB rating
    const imdb_rating = data.imdbRating && data.imdbRating !== 'N/A'
      ? parseFloat(data.imdbRating)
      : null

    // Extract Rotten Tomatoes from Ratings array
    let rotten_tomatoes = null
    if (data.Ratings) {
      const rt = data.Ratings.find(r => r.Source === 'Rotten Tomatoes')
      if (rt && rt.Value) {
        rotten_tomatoes = parseInt(rt.Value.replace('%', ''))
      }
    }

    return { imdb_rating, rotten_tomatoes }
  } catch (err) {
    console.error('OMDB error:', err)
    return { imdb_rating: null, rotten_tomatoes: null }
  }
}

// Fetch full movie data from TMDB (poster, rating, trailer, cast, director)
async function getTMDBData(title, year) {
  if (!TMDB_API_KEY) return { poster: '', tmdb_rating: null, trailer_url: '', cast: [], director: '', tmdb_year: null }

  try {
    // Search for the movie
    const query = encodeURIComponent(title)
    const yearParam = year ? `&year=${year}` : ''
    const searchResponse = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${query}${yearParam}`
    )

    if (!searchResponse.ok) return { poster: '', tmdb_rating: null, trailer_url: '', cast: [], director: '', tmdb_year: null }

    const searchData = await searchResponse.json()
    if (!searchData.results || searchData.results.length === 0) {
      return { poster: '', tmdb_rating: null, trailer_url: '', cast: [], director: '', tmdb_year: null }
    }

    const movie = searchData.results[0]
    const movieId = movie.id
    const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : ''
    const tmdb_rating = movie.vote_average || null
    const tmdb_year = movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null

    // Fetch videos (trailers) and credits (cast + crew) in parallel
    const [videosResponse, creditsResponse] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${TMDB_API_KEY}`),
      fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${TMDB_API_KEY}`)
    ])

    // Get trailer URL
    let trailer_url = ''
    if (videosResponse.ok) {
      const videosData = await videosResponse.json()
      const trailer = videosData.results?.find(
        v => v.type === 'Trailer' && v.site === 'YouTube'
      ) || videosData.results?.find(
        v => v.site === 'YouTube'
      )
      if (trailer) {
        trailer_url = `https://www.youtube.com/watch?v=${trailer.key}`
      }
    }

    // Get top cast members and director
    let cast = []
    let director = ''
    if (creditsResponse.ok) {
      const creditsData = await creditsResponse.json()
      cast = creditsData.cast?.slice(0, 5).map(actor => actor.name) || []
      const directorInfo = creditsData.crew?.find(person => person.job === 'Director')
      director = directorInfo?.name || ''
    }

    return { poster, tmdb_rating, trailer_url, cast, director, tmdb_year }
  } catch (err) {
    console.error('TMDB error:', err)
    return { poster: '', tmdb_rating: null, trailer_url: '', cast: [], director: '', tmdb_year: null }
  }
}

// Call Anthropic API for AI-enhanced data (mood, genre, streaming)
async function getAIData(title, apiKey, retryCount = 0) {
  const MAX_RETRIES = 2
  const RETRY_DELAY_MS = 2000

  // Check if we're currently rate limited
  if (isRateLimited()) {
    const status = getRateLimitStatus()
    return {
      success: false,
      rateLimited: true,
      remainingSeconds: Math.ceil(status.remainingMs / 1000),
      data: null
    }
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: `For the movie "${title}", provide ONLY a JSON object with:
{
  "genre": "One from: ${GENRES.join(', ')}",
  "mood": "One from: ${MOODS.join(', ')}",
  "streaming": ["Current streaming services from: ${STREAMING.join(', ')}"]
}
Return ONLY valid JSON, no explanation.`
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.json()

      // Check for rate limit error
      if (errorData?.error?.type === 'rate_limit_error') {
        // Extract retry-after if available, default to 60 seconds
        const retryAfterHeader = response.headers.get('retry-after')
        const retryAfterMs = retryAfterHeader ? parseInt(retryAfterHeader) * 1000 : 60000

        setRateLimited(retryAfterMs)

        // Retry after delay if we haven't exceeded max retries
        if (retryCount < MAX_RETRIES) {
          if (isDev) console.log(`Rate limited, retrying in ${RETRY_DELAY_MS}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`)
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
          return getAIData(title, apiKey, retryCount + 1)
        }

        return {
          success: false,
          rateLimited: true,
          remainingSeconds: Math.ceil(retryAfterMs / 1000),
          data: null
        }
      }

      console.error('Anthropic API error:', errorData)
      return { success: false, rateLimited: false, data: null }
    }

    const data = await response.json()

    // Extract text from response content
    const textContent = data.content
      ?.filter(item => item.type === 'text')
      .map(item => item.text)
      .join('') || ''

    // Try to extract JSON from response
    const jsonMatch = textContent
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      console.error('Could not find JSON in AI response:', textContent)
      return { success: false, rateLimited: false, data: null }
    }

    const aiData = JSON.parse(jsonMatch[0])
    return { success: true, rateLimited: false, data: aiData }

  } catch (error) {
    console.error('AI call error:', error)
    return { success: false, rateLimited: false, data: null }
  }
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { title, aiOnly = false, tmdbData = null } = req.body

  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Movie title is required' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY

  // If this is an AI-only request (background enrichment)
  if (aiOnly) {
    if (!apiKey) {
      return res.status(503).json({ error: 'AI service not configured', ai_unavailable: true })
    }

    const aiResult = await getAIData(title, apiKey)

    if (aiResult.rateLimited) {
      return res.status(429).json({
        error: 'AI service busy',
        ai_unavailable: true,
        retry_after_seconds: aiResult.remainingSeconds
      })
    }

    if (!aiResult.success) {
      return res.status(500).json({ error: 'AI processing failed', ai_unavailable: true })
    }

    return res.status(200).json({
      genre: GENRES.includes(aiResult.data.genre) ? aiResult.data.genre : '',
      mood: MOODS.includes(aiResult.data.mood) ? aiResult.data.mood : '',
      streaming: Array.isArray(aiResult.data.streaming)
        ? aiResult.data.streaming.filter(s => STREAMING.includes(s))
        : []
    })
  }

  // Full search: Get TMDB/OMDB data first (these are reliable)
  // Extract year from title if present (e.g., "The Ides of March 2011")
  const yearMatch = title.match(/\b(19|20)\d{2}\b/)
  const searchYear = yearMatch ? parseInt(yearMatch[0]) : null
  const cleanTitle = title.replace(/\b(19|20)\d{2}\b/, '').trim()

  const [tmdbResult, omdbResult] = await Promise.all([
    getTMDBData(cleanTitle, searchYear),
    getOMDBRatings(cleanTitle, searchYear)
  ])

  // Base result with TMDB/OMDB data
  const baseResult = {
    title: cleanTitle,
    director: tmdbResult.director || '',
    year: tmdbResult.tmdb_year || searchYear,
    poster: tmdbResult.poster,
    trailer_url: tmdbResult.trailer_url,
    tmdb_rating: tmdbResult.tmdb_rating,
    cast: tmdbResult.cast,
    imdb_rating: omdbResult.imdb_rating,
    rotten_tomatoes: omdbResult.rotten_tomatoes,
    // These will be filled by AI or left empty
    genre: '',
    mood: '',
    streaming: [],
    // Flag to indicate if AI data is pending
    ai_pending: false
  }

  // If no API key, return TMDB-only data
  if (!apiKey) {
    return res.status(200).json({
      ...baseResult,
      ai_pending: true,
      ai_unavailable: true
    })
  }

  // Try to get AI data
  const aiResult = await getAIData(cleanTitle, apiKey)

  if (aiResult.success && aiResult.data) {
    // AI succeeded, return complete data
    return res.status(200).json({
      ...baseResult,
      genre: GENRES.includes(aiResult.data.genre) ? aiResult.data.genre : '',
      mood: MOODS.includes(aiResult.data.mood) ? aiResult.data.mood : '',
      streaming: Array.isArray(aiResult.data.streaming)
        ? aiResult.data.streaming.filter(s => STREAMING.includes(s))
        : [],
      ai_pending: false
    })
  }

  // AI failed - return TMDB data with pending flag
  return res.status(200).json({
    ...baseResult,
    ai_pending: true,
    ai_unavailable: aiResult.rateLimited,
    retry_after_seconds: aiResult.remainingSeconds || 60
  })
}
