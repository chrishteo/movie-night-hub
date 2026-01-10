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

export function filterMovies(movies, filters, currentUser, myStatuses = {}, allUserStatuses = []) {
  return movies.filter(m => {
    // Search by title (case-insensitive)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const titleMatch = m.title?.toLowerCase().includes(searchLower)
      const directorMatch = m.director?.toLowerCase().includes(searchLower)
      if (!titleMatch && !directorMatch) return false
    }
    // Only filter by "mine" if currentUser is set to avoid filtering out all movies during initial load
    if (filters.view === 'mine' && currentUser && m.added_by !== currentUser) return false

    // Shared view: movies from others that user has acknowledged but not watched
    if (filters.view === 'shared' && currentUser) {
      const myStatus = myStatuses[m.id]
      // Must be from someone else
      if (m.added_by === currentUser) return false
      // Must be acknowledged (added to watchlist)
      if (!myStatus?.acknowledged) return false
      // Must not be watched yet
      if (myStatus?.watched) return false
    }

    if (filters.addedBy && m.added_by !== filters.addedBy) return false
    if (filters.genre && m.genre !== filters.genre) return false
    if (filters.mood && m.mood !== filters.mood) return false

    // Watched filter - unwatched global shows movies no one has watched
    if (filters.watched === 'unwatched') {
      const anyUserWatched = allUserStatuses.some(s => s.movie_id === m.id && s.watched)
      if (m.watched || anyUserWatched) return false
    }
    if (filters.watched === 'watchedByMe') {
      const myStatus = myStatuses[m.id]
      if (!myStatus?.watched) return false
    }
    if (filters.watched === 'unwatchedByMe') {
      const myStatus = myStatuses[m.id]
      if (myStatus?.watched) return false
    }

    if (filters.streaming && (!m.streaming || !m.streaming.includes(filters.streaming))) return false
    return true
  })
}

export function sortMovies(movies, sortBy, options = {}) {
  const { view, myStatuses = {}, allUserStatuses = [] } = options

  // Helper to get average rating from all users
  const getAverageRating = (movieId) => {
    const ratings = allUserStatuses.filter(s => s.movie_id === movieId && s.rating > 0)
    if (ratings.length === 0) return 0
    return ratings.reduce((sum, s) => sum + s.rating, 0) / ratings.length
  }

  // Helper to get my personal rating
  const getMyRating = (movieId) => {
    return myStatuses[movieId]?.rating || 0
  }

  return [...movies].sort((a, b) => {
    switch (sortBy) {
      case 'created_at':
        return new Date(b.created_at || 0) - new Date(a.created_at || 0)
      case 'year':
        return (b.year || 0) - (a.year || 0)
      case 'rating':
        // In "mine" view, sort by personal rating; otherwise by average rating
        if (view === 'mine') {
          return getMyRating(b.id) - getMyRating(a.id)
        }
        return getAverageRating(b.id) - getAverageRating(a.id)
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
