export function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function formatTimestamp(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

export function encodeShareData(movies) {
  const data = {
    movies: movies.map(m => ({
      t: m.title,
      d: m.director,
      g: m.genre,
      y: m.year,
      m: m.mood,
      p: m.poster,
      s: m.streaming
    }))
  }
  return btoa(encodeURIComponent(JSON.stringify(data)))
}

export function decodeShareData(encoded) {
  try {
    const json = decodeURIComponent(atob(encoded))
    const data = JSON.parse(json)
    return data.movies.map(m => ({
      title: m.t,
      director: m.d,
      genre: m.g,
      year: m.y,
      mood: m.m,
      poster: m.p,
      streaming: m.s || []
    }))
  } catch {
    return null
  }
}

export function filterMovies(movies, filters, currentUser) {
  return movies.filter(m => {
    if (filters.view === 'mine' && m.added_by !== currentUser) return false
    if (filters.genre && m.genre !== filters.genre) return false
    if (filters.mood && m.mood !== filters.mood) return false
    if (filters.watched === 'watched' && !m.watched) return false
    if (filters.watched === 'unwatched' && m.watched) return false
    if (filters.favorites && !m.favorite) return false
    if (filters.streaming && (!m.streaming || !m.streaming.includes(filters.streaming))) return false
    return true
  })
}

export function sortMovies(movies, sortBy) {
  return [...movies].sort((a, b) => {
    switch (sortBy) {
      case 'created_at':
        return new Date(b.created_at || 0) - new Date(a.created_at || 0)
      case 'year':
        return (b.year || 0) - (a.year || 0)
      case 'rating':
        return (b.rating || 0) - (a.rating || 0)
      case 'title':
        return (a.title || '').localeCompare(b.title || '')
      default:
        return 0
    }
  })
}

export function getVoteTally(votes, movieId, users) {
  let yes = 0
  let no = 0
  users.forEach(user => {
    const vote = votes.find(v => v.movie_id === movieId && v.user_name === user.name)
    if (vote?.vote === 'yes') yes++
    if (vote?.vote === 'no') no++
  })
  return { yes, no }
}

export function getUserVote(votes, movieId, userName) {
  const vote = votes.find(v => v.movie_id === movieId && v.user_name === userName)
  return vote?.vote || null
}

export function findWinner(movies, votes, users) {
  const unwatched = movies.filter(m => !m.watched)
  let best = null
  let bestScore = -Infinity

  unwatched.forEach(movie => {
    const tally = getVoteTally(votes, movie.id, users)
    const score = tally.yes - tally.no
    if (score > bestScore) {
      bestScore = score
      best = movie
    }
  })

  return best
}

export function getRandomMovie(movies) {
  const unwatched = movies.filter(m => !m.watched)
  if (unwatched.length === 0) return null
  return unwatched[Math.floor(Math.random() * unwatched.length)]
}
