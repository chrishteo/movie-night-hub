import { useState, useEffect, useMemo } from 'react'
import { getAllMovies } from '../lib/database'

export default function MoviePickerModal({
  maxPicks = 5,
  userName,
  onConfirm,
  onCancel,
  darkMode
}) {
  const [allMovies, setAllMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMovies, setSelectedMovies] = useState([])
  const [search, setSearch] = useState('')

  // Fetch all movies
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const movies = await getAllMovies()
        setAllMovies(movies)
      } catch (err) {
        console.error('Failed to fetch movies:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchMovies()
  }, [])

  // Filter to user's unwatched movies
  const userUnwatchedMovies = useMemo(() => {
    return allMovies.filter(m =>
      m.added_by === userName && !m.watched
    )
  }, [allMovies, userName])

  // Apply search filter
  const filteredMovies = useMemo(() => {
    if (!search.trim()) return userUnwatchedMovies
    const searchLower = search.toLowerCase()
    return userUnwatchedMovies.filter(m =>
      m.title.toLowerCase().includes(searchLower) ||
      m.director?.toLowerCase().includes(searchLower) ||
      m.genre?.toLowerCase().includes(searchLower) ||
      m.year?.toString().includes(searchLower)
    )
  }, [userUnwatchedMovies, search])

  const toggleMovie = (movieId) => {
    setSelectedMovies(prev => {
      if (prev.includes(movieId)) {
        return prev.filter(id => id !== movieId)
      }
      // Don't allow more than maxPicks
      if (prev.length >= maxPicks) {
        return prev
      }
      return [...prev, movieId]
    })
  }

  const handleConfirm = () => {
    if (selectedMovies.length > 0) {
      onConfirm(selectedMovies)
    }
  }

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const cardInner = darkMode ? 'bg-gray-700' : 'bg-gray-100'
  const border = darkMode ? 'border-gray-700' : 'border-gray-300'
  const inputBg = darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'

  const actualMaxPicks = Math.min(maxPicks, userUnwatchedMovies.length)
  const canPickMore = selectedMovies.length < actualMaxPicks

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-auto modal-safe-area"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className={`${card} rounded-lg p-4 w-full max-w-2xl max-h-[85vh] flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">Pick Your Movies</h2>
            <p className="text-sm text-gray-400">
              Select up to {actualMaxPicks} movie{actualMaxPicks !== 1 ? 's' : ''} for voting
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-lg font-bold ${
              selectedMovies.length === actualMaxPicks
                ? 'text-green-400'
                : 'text-purple-400'
            }`}>
              {selectedMovies.length}/{actualMaxPicks}
            </span>
            <button
              onClick={onCancel}
              className="p-1 hover:bg-gray-500/30 rounded-full transition-colors"
              title="Close (Esc)"
            >
              <span className="text-xl leading-none">&times;</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : userUnwatchedMovies.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <p className="text-4xl mb-4">🎬</p>
            <p className="text-lg font-medium mb-2">No movies to pick</p>
            <p className="text-gray-400 text-sm">
              You don't have any unwatched movies in your list.
            </p>
            <button
              onClick={onCancel}
              className="mt-4 px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search your movies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${inputBg} focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
            </div>

            {/* Movie Grid */}
            <div className="flex-1 overflow-y-auto mb-4">
              {filteredMovies.length === 0 ? (
                <p className="text-center py-8 text-gray-400">No movies match your search</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {filteredMovies.map(movie => {
                    const isSelected = selectedMovies.includes(movie.id)
                    const isDisabled = !isSelected && !canPickMore

                    return (
                      <button
                        key={movie.id}
                        onClick={() => toggleMovie(movie.id)}
                        disabled={isDisabled}
                        className={`relative rounded-lg overflow-hidden transition-all ${
                          isSelected
                            ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-gray-800'
                            : isDisabled
                              ? 'opacity-40 cursor-not-allowed'
                              : 'hover:ring-2 hover:ring-purple-500/50'
                        }`}
                      >
                        {/* Poster or placeholder */}
                        {movie.poster ? (
                          <img
                            src={movie.poster}
                            alt={movie.title}
                            className="w-full aspect-[2/3] object-cover"
                            onError={(e) => { e.target.style.display = 'none' }}
                          />
                        ) : (
                          <div className={`w-full aspect-[2/3] ${cardInner} flex items-center justify-center`}>
                            <span className="text-3xl">🎬</span>
                          </div>
                        )}

                        {/* Selection indicator */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-purple-600/30 flex items-center justify-center">
                            <span className="text-3xl">✓</span>
                          </div>
                        )}

                        {/* Title overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <p className="text-xs font-medium truncate text-white">
                            {movie.title}
                          </p>
                          {movie.year && (
                            <p className="text-xs text-gray-300">{movie.year}</p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-gray-700">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedMovies.length === 0}
                className="flex-1 px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm ({selectedMovies.length})
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
