import { useMemo, useCallback } from 'react'

/**
 * Hook to track movies added by other users that haven't been acknowledged yet
 * @param {Array} movies - Full list of movies
 * @param {Object} myStatuses - Map of movieId -> user's status for that movie
 * @param {string} authUserId - Current user's auth ID
 * @param {Function} acknowledgeMovie - Function to acknowledge a movie
 */
export function useNewMovies(movies, myStatuses, authUserId, acknowledgeMovie) {
  // Get movies added by others that haven't been acknowledged
  const newMovies = useMemo(() => {
    if (!authUserId || !movies) return []

    return movies.filter(movie => {
      // Skip movies added by current user
      if (movie.user_id === authUserId) return false

      // Check if acknowledged
      const status = myStatuses[movie.id]
      return !status?.acknowledged
    })
  }, [movies, myStatuses, authUserId])

  const newMovieCount = newMovies.length

  // Handle acknowledging a movie with watched status
  const handleAcknowledge = useCallback(async (movieId, alreadyWatched) => {
    await acknowledgeMovie(movieId, alreadyWatched)
  }, [acknowledgeMovie])

  // Handle acknowledging all movies as "haven't seen"
  const handleAcknowledgeAll = useCallback(async () => {
    for (const movie of newMovies) {
      await acknowledgeMovie(movie.id, false)
    }
  }, [newMovies, acknowledgeMovie])

  return {
    newMovies,
    newMovieCount,
    handleAcknowledge,
    handleAcknowledgeAll
  }
}
