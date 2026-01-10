import { useMemo, useCallback, useState, useEffect } from 'react'
import { getAllMovies } from '../lib/database'

/**
 * Hook to track movies added by other users that haven't been acknowledged yet
 * @param {Object} myStatuses - Map of movieId -> user's status for that movie
 * @param {string} authUserId - Current user's auth ID
 * @param {string} currentUserName - Current user's display name (for legacy movies)
 * @param {Function} acknowledgeMovie - Function to acknowledge a movie
 * @param {boolean} statusesLoading - Whether myStatuses is still loading
 */
export function useNewMovies(myStatuses, authUserId, currentUserName, acknowledgeMovie, statusesLoading) {
  const [allMovies, setAllMovies] = useState([])
  const [moviesLoading, setMoviesLoading] = useState(true)

  // Fetch all movies for the NEW badge (independent of current view filter)
  useEffect(() => {
    const fetchAllMovies = async () => {
      try {
        setMoviesLoading(true)
        const movies = await getAllMovies()
        setAllMovies(movies || [])
      } catch (err) {
        console.error('Error fetching all movies for new badge:', err)
      } finally {
        setMoviesLoading(false)
      }
    }
    fetchAllMovies()
  }, [])

  // Get movies added by others that haven't been acknowledged
  const newMovies = useMemo(() => {
    // Don't calculate until both movies and statuses have loaded
    if (!authUserId || moviesLoading || statusesLoading) {
      return []
    }

    return allMovies.filter(movie => {
      // Skip movies added by current user (check both user_id and added_by for legacy)
      if (movie.user_id === authUserId) return false
      if (movie.added_by === currentUserName) return false

      // Check if acknowledged
      const status = myStatuses[movie.id]
      return !status?.acknowledged
    })
  }, [allMovies, myStatuses, authUserId, currentUserName, moviesLoading, statusesLoading])

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
