import { GENRES, MOODS, STREAMING } from '../utils/constants'

export async function searchMovie(title) {
  const response = await fetch('/api/search-movie', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to search for movie')
  }

  const data = await response.json()

  // Validate and normalize the response
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
    rotten_tomatoes: data.rotten_tomatoes || null
  }
}

export async function getRecommendations(movies) {
  const response = await fetch('/api/recommendations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ movies })
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
