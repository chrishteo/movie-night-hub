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

export default function NewMoviesModal({
  movies = [],
  onAcknowledge,
  onAcknowledgeAll,
  onClose,
  onViewDetails,
  darkMode
}) {
  const { addToast } = useToast()
  const [processingId, setProcessingId] = useState(null)
  const [processedIds, setProcessedIds] = useState(new Set())
  const [processingAll, setProcessingAll] = useState(false)

  useEscapeKey(onClose)

  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const border = darkMode ? 'border-gray-700' : 'border-gray-300'
  const textMuted = darkMode ? 'text-gray-400' : 'text-gray-600'

  // Movies not yet processed in this session
  const remainingMovies = movies.filter(m => !processedIds.has(m.id))

  const handleMarkWatched = async (movie) => {
    setProcessingId(movie.id)
    try {
      await onAcknowledge(movie.id, true)
      setProcessedIds(prev => new Set([...prev, movie.id]))
      addToast(`"${movie.title}" marked as already watched`, 'success')
    } catch (err) {
      addToast('Failed to update movie', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleAddToWatchlist = async (movie) => {
    setProcessingId(movie.id)
    try {
      await onAcknowledge(movie.id, false)
      setProcessedIds(prev => new Set([...prev, movie.id]))
      addToast(`"${movie.title}" added to your watchlist`, 'success')
    } catch (err) {
      addToast('Failed to update movie', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleAddAllToWatchlist = async () => {
    setProcessingAll(true)
    try {
      await onAcknowledgeAll()
      // Mark all as processed
      setProcessedIds(new Set(movies.map(m => m.id)))
      addToast(`${remainingMovies.length} movies added to your watchlist`, 'success')
    } catch (err) {
      addToast('Failed to update movies', 'error')
    } finally {
      setProcessingAll(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 modal-backdrop modal-safe-area">
      <div className={`${card} rounded-lg w-full max-w-lg max-h-[85vh] flex flex-col modal-content`}>
        {/* Header */}
        <div className={`p-4 border-b ${border} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🆕</span>
            <div>
              <h2 className="text-xl font-bold">New Movies</h2>
              <p className={`text-sm ${textMuted}`}>
                {remainingMovies.length} movie{remainingMovies.length !== 1 ? 's' : ''} to review
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`${textMuted} hover:text-white text-xl p-1`}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {remainingMovies.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl mb-3 block">✅</span>
              <p className={textMuted}>All caught up!</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className={`text-sm ${textMuted} mb-4`}>
                Other users added these movies. Add them to your watchlist to include them in your spin wheel, or mark as already watched to skip them.
              </p>
              {remainingMovies.map(movie => (
                <div key={movie.id} className={`${card} border ${border} rounded-lg p-4`}>
                  <div className="flex gap-3">
                    {/* Poster */}
                    {movie.poster ? (
                      <img
                        src={movie.poster}
                        alt=""
                        className="w-16 h-24 object-cover rounded cursor-pointer hover:opacity-80 flex-shrink-0"
                        onClick={() => {
                          onViewDetails?.(movie)
                          onClose()
                        }}
                      />
                    ) : (
                      <div className={`w-16 h-24 rounded flex items-center justify-center text-2xl flex-shrink-0 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        🎬
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold truncate">{movie.title}</h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        {movie.year && <span className={`text-sm ${textMuted}`}>{movie.year}</span>}
                        {movie.genre && (
                          <span className="px-2 py-0.5 bg-purple-600/30 text-purple-300 rounded text-xs">
                            {movie.genre}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-purple-400 mt-1">
                        Added by {movie.added_by}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleMarkWatched(movie)}
                      disabled={processingId === movie.id || processingAll}
                      className="flex-1 px-3 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white text-sm disabled:opacity-50 transition-colors"
                    >
                      {processingId === movie.id ? '...' : 'Already Watched'}
                    </button>
                    <button
                      onClick={() => handleAddToWatchlist(movie)}
                      disabled={processingId === movie.id || processingAll}
                      className="flex-1 px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-white text-sm disabled:opacity-50 transition-colors"
                    >
                      {processingId === movie.id ? '...' : 'Add to Watchlist'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {remainingMovies.length > 1 && (
          <div className={`p-4 border-t ${border}`}>
            <button
              onClick={handleAddAllToWatchlist}
              disabled={processingAll}
              className="w-full px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 transition-colors"
            >
              {processingAll ? 'Processing...' : `Add All ${remainingMovies.length} to Watchlist`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
