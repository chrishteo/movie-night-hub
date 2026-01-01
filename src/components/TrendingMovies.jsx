import { useState, useEffect } from 'react'
import { useToast } from './Toast'

// Hook for Escape key handling
function useEscapeKey(onClose) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])
}

export default function TrendingMovies({ onAddMovie, existingMovies, currentUser, onClose, darkMode }) {
  const { addToast } = useToast()
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeWindow, setTimeWindow] = useState('week')

  // Handle Escape key
  useEscapeKey(onClose)
  const [addingId, setAddingId] = useState(null)

  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const border = darkMode ? 'border-gray-700' : 'border-gray-300'

  useEffect(() => {
    fetchTrending()
  }, [timeWindow])

  const fetchTrending = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/trending?window=${timeWindow}`)
      if (!response.ok) throw new Error('Failed to fetch trending movies')

      const data = await response.json()
      setMovies(data.movies || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isAlreadyAdded = (tmdbId, title) => {
    return existingMovies?.some(m =>
      m.title?.toLowerCase() === title?.toLowerCase()
    )
  }

  const handleAddMovie = async (movie) => {
    setAddingId(movie.tmdb_id)

    try {
      // Fetch full movie details using existing search-movie API
      const response = await fetch('/api/search-movie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: movie.title })
      })

      if (!response.ok) throw new Error('Failed to fetch movie details')

      const movieData = await response.json()

      // Add the movie
      await onAddMovie({
        ...movieData,
        added_by: currentUser
      })
    } catch (err) {
      console.error('Error adding movie:', err)
      addToast('Failed to add movie', 'error')
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40 modal-backdrop">
      <div className={`${card} rounded-lg w-full max-w-4xl max-h-[85vh] flex flex-col modal-content`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <h2 className="text-xl font-bold">Trending Movies</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTimeWindow('day')}
              className={`px-3 py-1 rounded text-sm ${
                timeWindow === 'day'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeWindow('week')}
              className={`px-3 py-1 rounded text-sm ${
                timeWindow === 'week'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
            >
              This Week
            </button>
            <button
              onClick={onClose}
              className="ml-2 text-gray-400 hover:text-white text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin text-4xl">🎬</div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400">
              <p>{error}</p>
              <button
                onClick={fetchTrending}
                className="mt-2 px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {movies.map(movie => {
                const alreadyAdded = isAlreadyAdded(movie.tmdb_id, movie.title)
                const isAdding = addingId === movie.tmdb_id

                return (
                  <div
                    key={movie.tmdb_id}
                    className={`${card} border ${border} rounded-lg overflow-hidden group relative`}
                  >
                    {/* Poster */}
                    <div className="aspect-[2/3] relative">
                      {movie.poster ? (
                        <img
                          src={movie.poster}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center text-4xl">
                          🎬
                        </div>
                      )}

                      {/* Rating badge */}
                      {movie.rating > 0 && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-yellow-500 text-black text-xs font-bold">
                          ★ {movie.rating.toFixed(1)}
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col">
                        <p className="text-xs line-clamp-4 flex-1">{movie.overview}</p>
                        <div className="mt-2">
                          {alreadyAdded ? (
                            <span className="block text-center text-green-400 text-sm py-2">
                              ✓ Already in list
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAddMovie(movie)}
                              disabled={isAdding}
                              className="w-full px-3 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white text-sm disabled:opacity-50"
                            >
                              {isAdding ? 'Adding...' : '+ Add to List'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="p-2">
                      <h3 className="font-medium text-sm truncate" title={movie.title}>
                        {movie.title}
                      </h3>
                      <p className="text-xs opacity-50">{movie.year}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 text-center text-xs opacity-50">
          Powered by TMDB
        </div>
      </div>
    </div>
  )
}
