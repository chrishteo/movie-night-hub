import { useState, useEffect, useCallback } from 'react'
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
  const [error, setError] = useState(null)

  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getMovies()
      setMovies(data)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching movies:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMovies()

    // Subscribe to real-time updates
    const subscription = subscribeToMovies((payload) => {
      if (payload.eventType === 'INSERT') {
        setMovies(prev => [payload.new, ...prev])
      } else if (payload.eventType === 'UPDATE') {
        setMovies(prev => prev.map(m => m.id === payload.new.id ? payload.new : m))
      } else if (payload.eventType === 'DELETE') {
        setMovies(prev => prev.filter(m => m.id !== payload.old.id))
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
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const toggleWatched = useCallback(async (id) => {
    const movie = movies.find(m => m.id === id)
    if (!movie) return

    try {
      const updated = await toggleMovieWatched(id, !movie.watched)
      setMovies(prev => prev.map(m => m.id === id ? updated : m))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [movies])

  const toggleFavorite = useCallback(async (id) => {
    const movie = movies.find(m => m.id === id)
    if (!movie) return

    try {
      const updated = await toggleMovieFavorite(id, !movie.favorite)
      setMovies(prev => prev.map(m => m.id === id ? updated : m))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [movies])

  return {
    movies,
    loading,
    error,
    addMovie,
    updateMovie,
    deleteMovie,
    toggleWatched,
    toggleFavorite,
    refetch: fetchMovies
  }
}
