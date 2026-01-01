import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getMovies,
  addMovie as addMovieDb,
  updateMovie as updateMovieDb,
  deleteMovie as deleteMovieDb,
  toggleMovieWatched,
  toggleMovieFavorite,
  subscribeToMovies
} from '../lib/database'

export function useMovies() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const pageRef = useRef(0)

  const fetchMovies = useCallback(async (reset = true) => {
    try {
      if (reset) {
        setLoading(true)
        pageRef.current = 0
      } else {
        setLoadingMore(true)
      }

      const result = await getMovies(pageRef.current)

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

  useEffect(() => {
    fetchMovies()

    // Subscribe to real-time updates
    const subscription = subscribeToMovies((payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        setMovies(prev => [payload.new, ...prev])
        setTotal(prev => prev + 1)
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        setMovies(prev => prev.map(m => m.id === payload.new.id ? payload.new : m))
      } else if (payload.eventType === 'DELETE' && payload.old?.id) {
        setMovies(prev => prev.filter(m => m.id !== payload.old.id))
        setTotal(prev => prev - 1)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchMovies])

  const addMovie = useCallback(async (movie) => {
    try {
      const newMovie = await addMovieDb(movie)
      // Update local state immediately
      setMovies(prev => [newMovie, ...prev])
      setTotal(prev => prev + 1)
      return newMovie
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

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

  // Fixed: Use functional update to avoid dependency on movies array
  const toggleFavorite = useCallback(async (id) => {
    // Get current state without depending on movies in closure
    let currentFavorite = null
    setMovies(prev => {
      const movie = prev.find(m => m.id === id)
      currentFavorite = movie?.favorite
      return prev // Don't modify yet
    })

    if (currentFavorite === null) return

    try {
      const updated = await toggleMovieFavorite(id, !currentFavorite)
      setMovies(prev => prev.map(m => m.id === id ? updated : m))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

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
    toggleFavorite,
    loadMore,
    refetch: fetchMovies
  }
}
