import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getMovies,
  addMovie as addMovieDb,
  updateMovie as updateMovieDb,
  deleteMovie as deleteMovieDb,
  toggleMovieWatched,
  subscribeToMovies
} from '../lib/database'

export function useMovies(authUserId = null, serverFilters = {}) {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const pageRef = useRef(0)
  const filtersRef = useRef(serverFilters)

  const fetchMovies = useCallback(async (reset = true, filters = filtersRef.current) => {
    try {
      if (reset) {
        setLoading(true)
        pageRef.current = 0
      } else {
        setLoadingMore(true)
      }

      const result = await getMovies(pageRef.current, filters)

      if (reset) {
        setMovies(result.movies)
      } else {
        setMovies(prev => [...prev, ...result.movies])
      }

      setHasMore(result.hasMore)
      setTotal(result.total)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching movies:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    pageRef.current += 1
    await fetchMovies(false)
  }, [fetchMovies, loadingMore, hasMore])

  // Refetch when server filters change
  useEffect(() => {
    const filtersChanged = JSON.stringify(serverFilters) !== JSON.stringify(filtersRef.current)
    filtersRef.current = serverFilters

    if (filtersChanged) {
      fetchMovies(true, serverFilters)
    }
  }, [serverFilters, fetchMovies])

  useEffect(() => {
    fetchMovies()

    // Subscribe to real-time updates
    const subscription = subscribeToMovies((payload) => {
      // Check if the movie matches current server filter
      const matchesFilter = (movie) => !filtersRef.current.addedBy ||
        movie?.added_by === filtersRef.current.addedBy

      if (payload.eventType === 'INSERT' && payload.new) {
        if (matchesFilter(payload.new)) {
          setMovies(prev => [payload.new, ...prev])
          setTotal(prev => prev + 1)
        }
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        setMovies(prev => {
          const wasInView = prev.some(m => m.id === payload.new.id)
          const shouldBeInView = matchesFilter(payload.new)

          if (wasInView && shouldBeInView) {
            return prev.map(m => m.id === payload.new.id ? payload.new : m)
          } else if (wasInView && !shouldBeInView) {
            setTotal(t => t - 1)
            return prev.filter(m => m.id !== payload.new.id)
          } else if (!wasInView && shouldBeInView) {
            setTotal(t => t + 1)
            return [payload.new, ...prev]
          }
          return prev
        })
      } else if (payload.eventType === 'DELETE' && payload.old?.id) {
        setMovies(prev => {
          const wasInView = prev.some(m => m.id === payload.old.id)
          if (wasInView) {
            setTotal(t => t - 1)
            return prev.filter(m => m.id !== payload.old.id)
          }
          return prev
        })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchMovies])

  const addMovie = useCallback(async (movie) => {
    try {
      // Pass authUserId for RLS security
      const newMovie = await addMovieDb(movie, authUserId)
      // Update local state immediately
      setMovies(prev => [newMovie, ...prev])
      setTotal(prev => prev + 1)
      return newMovie
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [authUserId])

  const updateMovie = useCallback(async (id, updates) => {
    try {
      const updatedMovie = await updateMovieDb(id, updates)
      // Update local state immediately
      setMovies(prev => prev.map(m => m.id === id ? updatedMovie : m))
      return updatedMovie
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const deleteMovie = useCallback(async (id) => {
    try {
      await deleteMovieDb(id)
      // Update local state immediately
      setMovies(prev => prev.filter(m => m.id !== id))
      setTotal(prev => prev - 1)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  // Fixed: Use functional update to avoid dependency on movies array
  const toggleWatched = useCallback(async (id) => {
    // Get current state without depending on movies in closure
    let currentWatched = null
    setMovies(prev => {
      const movie = prev.find(m => m.id === id)
      currentWatched = movie?.watched
      return prev // Don't modify yet
    })

    if (currentWatched === null) return

    try {
      const updated = await toggleMovieWatched(id, !currentWatched)
      setMovies(prev => prev.map(m => m.id === id ? updated : m))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  // Check if current user can modify a movie
  // For backward compatibility, also check added_by name for movies without user_id
  const canModifyMovie = useCallback((movie, currentUserName = null) => {
    if (!authUserId) return false
    // If movie has user_id, use that for ownership check
    if (movie.user_id) {
      return movie.user_id === authUserId
    }
    // Fallback: for legacy movies without user_id, check added_by name
    if (currentUserName && movie.added_by) {
      return movie.added_by === currentUserName
    }
    return false
  }, [authUserId])

  return {
    movies,
    loading,
    loadingMore,
    error,
    hasMore,
    total,
    addMovie,
    updateMovie,
    deleteMovie,
    toggleWatched,
    loadMore,
    refetch: fetchMovies,
    canModifyMovie,
    authUserId
  }
}
