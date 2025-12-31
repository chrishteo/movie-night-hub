import { useState, useEffect } from 'react'
import { useToast } from './Toast'
import { STREAMING_COLORS } from '../utils/constants'
import { formatDate } from '../utils/helpers'

function StreamingBadge({ service }) {
  return (
    <span className={`px-2 py-1 rounded text-xs text-white ${STREAMING_COLORS[service] || 'bg-gray-500'}`}>
      {service}
    </span>
  )
}

export default function MovieDetailsModal({
  movie,
  onClose,
  onEdit,
  onToggleWatched,
  onToggleFavorite,
  onAddMovie,
  existingMovies,
  currentUser,
  darkMode
}) {
  const { addToast } = useToast()
  const [similarMovies, setSimilarMovies] = useState([])
  const [loadingSimilar, setLoadingSimilar] = useState(false)
  const [similarError, setSimilarError] = useState(null)
  const [addingId, setAddingId] = useState(null)

  useEffect(() => {
    if (movie?.title) {
      fetchSimilarMovies()
    }
  }, [movie?.id])

  const fetchSimilarMovies = async () => {
    setLoadingSimilar(true)
    setSimilarError(null)
    try {
      const response = await fetch('/api/similar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: movie.title, year: movie.year })
      })
      if (response.ok) {
        const data = await response.json()
        setSimilarMovies(data.similar || [])
      } else {
        setSimilarError('Failed to load similar movies')
      }
    } catch (err) {
      console.error('Error fetching similar movies:', err)
      setSimilarError('Failed to load similar movies')
      addToast('Failed to load similar movies', 'error')
    } finally {
      setLoadingSimilar(false)
    }
  }

  const isAlreadyAdded = (title) => {
    return existingMovies?.some(m => m.title?.toLowerCase() === title?.toLowerCase())
  }

  const handleAddSimilar = async (similarMovie) => {
    if (!onAddMovie) return
    setAddingId(similarMovie.tmdb_id)
    try {
      const response = await fetch('/api/search-movie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: similarMovie.title })
      })
      if (response.ok) {
        const movieData = await response.json()
        await onAddMovie({ ...movieData, added_by: currentUser })
      }
    } catch (err) {
      console.error('Error adding similar movie:', err)
      addToast('Failed to add movie', 'error')
    } finally {
      setAddingId(null)
    }
  }

  if (!movie) return null

  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const border = darkMode ? 'border-gray-700' : 'border-gray-300'
  const textMuted = darkMode ? 'text-gray-400' : 'text-gray-600'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40 overflow-auto">
      <div className={`${card} rounded-lg w-full max-w-lg max-h-[90vh] overflow-auto`}>
        {/* Header with poster */}
        <div className="relative">
          {movie.poster ? (
            <div className="relative rounded-t-lg bg-black">
              <img
                src={movie.poster}
                alt={movie.title}
                className="w-full max-h-80 object-contain mx-auto"
                onError={(e) => { e.target.style.display = 'none' }}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                <h2 className="text-2xl font-bold text-white">{movie.title}</h2>
                <p className="text-gray-300">
                  {movie.director} {movie.director && movie.year && '•'} {movie.year}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-2xl font-bold">{movie.title}</h2>
              <p className={textMuted}>
                {movie.director} {movie.director && movie.year && '•'} {movie.year}
              </p>
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {movie.genre && (
              <span className="px-2 py-1 bg-purple-600 rounded text-sm text-white">
                {movie.genre}
              </span>
            )}
            {movie.mood && (
              <span className="px-2 py-1 bg-blue-600 rounded text-sm text-white">
                {movie.mood}
              </span>
            )}
          </div>

          {/* Ratings */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={textMuted}>Your Rating:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <span
                    key={s}
                    className={`text-lg ${s <= movie.rating ? 'text-yellow-400' : 'text-gray-500'}`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            {movie.tmdb_rating && (
              <div className="flex items-center gap-2">
                <span className={textMuted}>TMDB:</span>
                <span className="px-2 py-0.5 bg-yellow-600 rounded text-sm font-bold">
                  {movie.tmdb_rating.toFixed(1)}
                </span>
              </div>
            )}
            {movie.imdb_rating && (
              <div className="flex items-center gap-2">
                <span className={textMuted}>IMDB:</span>
                <span className="px-2 py-0.5 bg-amber-500 rounded text-sm font-bold">
                  {movie.imdb_rating.toFixed(1)}
                </span>
              </div>
            )}
            {movie.rotten_tomatoes && (
              <div className="flex items-center gap-2">
                <span className={textMuted}>RT:</span>
                <span className={`px-2 py-0.5 rounded text-sm font-bold ${movie.rotten_tomatoes >= 60 ? 'bg-red-500' : 'bg-green-600'}`}>
                  {movie.rotten_tomatoes}%
                </span>
              </div>
            )}
          </div>

          {/* Cast */}
          {movie.cast?.length > 0 && (
            <div>
              <p className={`text-sm ${textMuted} mb-2`}>Cast:</p>
              <p className="text-sm">{movie.cast.join(', ')}</p>
            </div>
          )}

          {/* Trailer */}
          {movie.trailer_url && (
            <a
              href={movie.trailer_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
            >
              ▶ Watch Trailer
            </a>
          )}

          {/* Streaming */}
          {movie.streaming?.length > 0 && (
            <div>
              <p className={`text-sm ${textMuted} mb-2`}>Available on:</p>
              <div className="flex flex-wrap gap-2">
                {movie.streaming.map(s => (
                  <StreamingBadge key={s} service={s} />
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {movie.notes && (
            <div>
              <p className={`text-sm ${textMuted} mb-1`}>Notes:</p>
              <p className="text-sm">{movie.notes}</p>
            </div>
          )}

          {/* Meta info */}
          <div className={`text-xs ${textMuted} space-y-1 pt-2 border-t ${border}`}>
            <p>Added by: {movie.added_by}</p>
            <p>Added: {formatDate(movie.created_at)}</p>
            {movie.watched && movie.watched_at && (
              <p>Watched: {formatDate(movie.watched_at)}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onToggleFavorite(movie.id)}
              className={`flex-1 px-4 py-2 rounded ${
                movie.favorite
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
            >
              {movie.favorite ? '♥ Favorited' : '♡ Add to Favorites'}
            </button>
            <button
              onClick={() => onToggleWatched(movie.id)}
              className={`flex-1 px-4 py-2 rounded ${
                movie.watched
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
            >
              {movie.watched ? '✓ Watched' : 'Mark Watched'}
            </button>
          </div>

          <button
            onClick={() => {
              onEdit(movie)
              onClose()
            }}
            className="w-full px-4 py-2 rounded bg-purple-600 hover:bg-purple-700"
          >
            ✏️ Edit Movie
          </button>

          {/* Similar Movies */}
          <div className={`pt-4 border-t ${border}`}>
            <h3 className="font-bold mb-3">Similar Movies</h3>
            {loadingSimilar ? (
              <div className="flex justify-center py-4">
                <span className="animate-spin text-2xl">🎬</span>
              </div>
            ) : similarError ? (
              <div className="flex flex-col items-center py-4">
                <p className={`text-sm ${textMuted} mb-2`}>{similarError}</p>
                <button
                  onClick={fetchSimilarMovies}
                  className="px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-700 text-white text-sm"
                >
                  Retry
                </button>
              </div>
            ) : similarMovies.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {similarMovies.map(sm => {
                  const alreadyAdded = isAlreadyAdded(sm.title)
                  const isAdding = addingId === sm.tmdb_id
                  return (
                    <div
                      key={sm.tmdb_id}
                      className={`flex-shrink-0 w-28 ${card} border ${border} rounded overflow-hidden`}
                    >
                      {sm.poster ? (
                        <img
                          src={sm.poster}
                          alt={sm.title}
                          className="w-full h-40 object-cover"
                        />
                      ) : (
                        <div className="w-full h-40 bg-gray-700 flex items-center justify-center text-3xl">
                          🎬
                        </div>
                      )}
                      <div className="p-2">
                        <p className="text-xs font-medium truncate" title={sm.title}>{sm.title}</p>
                        <p className="text-xs opacity-50">{sm.year}</p>
                        {sm.rating > 0 && (
                          <p className="text-xs text-yellow-400">★ {sm.rating.toFixed(1)}</p>
                        )}
                        {alreadyAdded ? (
                          <span className="text-xs text-green-400">✓ In list</span>
                        ) : onAddMovie && (
                          <button
                            onClick={() => handleAddSimilar(sm)}
                            disabled={isAdding}
                            className="mt-1 w-full text-xs px-2 py-1 rounded bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                          >
                            {isAdding ? '...' : '+ Add'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className={`text-sm ${textMuted}`}>No similar movies found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
