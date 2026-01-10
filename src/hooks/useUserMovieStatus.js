import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getUserMovieStatuses,
  getAllMovieStatuses,
  setUserMovieStatus,
  subscribeToUserMovieStatuses
} from '../lib/database'

export function useUserMovieStatus(authUserId) {
  const [statuses, setStatuses] = useState([]) // All statuses for all users
  const [myStatuses, setMyStatuses] = useState({}) // Map: movieId -> status
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStatuses = useCallback(async () => {
    if (!authUserId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const [allData, myData] = await Promise.all([
        getAllMovieStatuses(),
        getUserMovieStatuses(authUserId)
      ])

      setStatuses(allData || [])

      // Index my statuses by movie_id for quick lookup
      const myStatusMap = {}
      ;(myData || []).forEach(s => {
        myStatusMap[s.movie_id] = s
      })
      setMyStatuses(myStatusMap)

      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching user movie statuses:', err)
    } finally {
      setLoading(false)
    }
  }, [authUserId])

  useEffect(() => {
    fetchStatuses()

    const subscription = subscribeToUserMovieStatuses((payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const newStatus = payload.new

        // Update all statuses
        setStatuses(prev => {
          const filtered = prev.filter(s =>
            !(s.movie_id === newStatus.movie_id && s.user_id === newStatus.user_id)
          )
          return [...filtered, newStatus]
        })

        // Update my statuses if it's mine
        if (newStatus.user_id === authUserId) {
          setMyStatuses(prev => ({
            ...prev,
            [newStatus.movie_id]: newStatus
          }))
        }
      } else if (payload.eventType === 'DELETE' && payload.old) {
        setStatuses(prev => prev.filter(s => s.id !== payload.old.id))

        if (payload.old.user_id === authUserId) {
          setMyStatuses(prev => {
            const newMap = { ...prev }
            delete newMap[payload.old.movie_id]
            return newMap
          })
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchStatuses, authUserId])

  const toggleMyWatched = useCallback(async (movieId) => {
    if (!authUserId) return

    const current = myStatuses[movieId]
    const newWatched = !current?.watched

    try {
      await setUserMovieStatus(movieId, authUserId, { watched: newWatched })
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [authUserId, myStatuses])

  const setMyRating = useCallback(async (movieId, rating) => {
    if (!authUserId) return

    try {
      await setUserMovieStatus(movieId, authUserId, { rating })
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [authUserId])

  // Acknowledge a movie (mark as reviewed) with optional watched status
  const acknowledgeMovie = useCallback(async (movieId, alreadyWatched = false) => {
    if (!authUserId) return

    try {
      const updates = { acknowledged: true }
      if (alreadyWatched) {
        updates.watched = true
      }
      await setUserMovieStatus(movieId, authUserId, updates)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [authUserId])

  // Helper: Get my status for a movie
  const getMyStatus = useCallback((movieId) => {
    return myStatuses[movieId] || { watched: false, rating: 0 }
  }, [myStatuses])

  // Helper: Get all statuses for a movie (for showing multiple ratings)
  const getMovieStatuses = useCallback((movieId) => {
    return statuses.filter(s => s.movie_id === movieId)
  }, [statuses])

  // Helper: Calculate average rating for a movie
  const getAverageRating = useCallback((movieId) => {
    const movieStatuses = statuses.filter(s => s.movie_id === movieId && s.rating > 0)
    if (movieStatuses.length === 0) return null
    const sum = movieStatuses.reduce((acc, s) => acc + s.rating, 0)
    return sum / movieStatuses.length
  }, [statuses])

  // Helper: Get count of users who rated a movie
  const getRatingCount = useCallback((movieId) => {
    return statuses.filter(s => s.movie_id === movieId && s.rating > 0).length
  }, [statuses])

  // Helper: Get users who watched a movie
  const getWatchedByUsers = useCallback((movieId) => {
    return statuses.filter(s => s.movie_id === movieId && s.watched)
  }, [statuses])

  // Helper: Get count of users who watched a movie
  const getWatchedCount = useCallback((movieId) => {
    return statuses.filter(s => s.movie_id === movieId && s.watched).length
  }, [statuses])

  return {
    statuses,
    myStatuses,
    loading,
    error,
    toggleMyWatched,
    setMyRating,
    acknowledgeMovie,
    getMyStatus,
    getMovieStatuses,
    getAverageRating,
    getRatingCount,
    getWatchedByUsers,
    getWatchedCount,
    refetch: fetchStatuses
  }
}
