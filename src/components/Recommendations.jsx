import { useState, useEffect, useMemo } from 'react'
import { getRecommendations } from '../lib/api'
import Modal from './Modal'

export default function Recommendations({
  movies,
  currentUser,
  onAddMovie,
  onClose,
  darkMode,
  seedMovie = null // Optional: for "More like this" feature
}) {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addedTitles, setAddedTitles] = useState([]) // Track what user added this session

  // Get all movie titles in collection (normalized for comparison)
  const collectionTitles = useMemo(() => {
    return movies.map(m => m.title.toLowerCase().trim())
  }, [movies])

  const fetchRecommendations = async () => {
    setLoading(true)
    setError('')

    try {
      const recs = await getRecommendations(movies, seedMovie)

      // Filter out movies already in collection
      const filtered = recs.filter(rec => {
        const recTitle = rec.title.toLowerCase().trim()
        return !collectionTitles.includes(recTitle)
      })

      setRecommendations(filtered)
    } catch (err) {
      setError(err.message || 'Failed to get recommendations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [seedMovie])

  const handleAddRecommendation = async (rec) => {
    try {
      await onAddMovie({
        title: rec.title,
        director: rec.director || '',
        genre: rec.genre || '',
        year: rec.year || null,
        mood: rec.mood || '',
        poster: rec.poster || '',
        streaming: rec.streaming || [],
        rating: 0,
        watched: false,
        added_by: currentUser,
        notes: rec.reason || ''
      })
      // Track added movies to hide them from the list
      setAddedTitles(prev => [...prev, rec.title.toLowerCase().trim()])
    } catch (err) {
      console.error('Failed to add recommendation:', err)
    }
  }

  // Filter out movies added this session
  const visibleRecommendations = recommendations.filter(
    rec => !addedTitles.includes(rec.title.toLowerCase().trim())
  )

  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const border = darkMode ? 'border-gray-700' : 'border-gray-300'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40 overflow-auto modal-safe-area">
      <div className={`${card} rounded-lg p-4 w-full max-w-lg max-h-[90vh] overflow-auto`}>
        <h2 className="text-lg font-bold mb-1">
          {seedMovie ? '🎯 More Like This' : '💡 AI Recommendations'}
        </h2>
        {seedMovie && (
          <p className="text-sm text-purple-400 mb-4">
            Based on: {seedMovie.title}
          </p>
        )}
        {!seedMovie && <div className="mb-4" />}

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin text-3xl">🎬</div>
            <p className="mt-2 opacity-70">
              {seedMovie ? `Finding movies like ${seedMovie.title}...` : 'Analyzing your collection...'}
            </p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && visibleRecommendations.length === 0 && (
          <p className="text-center py-8 opacity-50">
            {addedTitles.length > 0
              ? 'All recommendations added! Click Refresh for more.'
              : 'No recommendations available'}
          </p>
        )}

        <div className="space-y-2">
          {visibleRecommendations.map((rec, i) => (
            <div key={i} className={`p-2 rounded border ${border} flex gap-2`}>
              {rec.poster ? (
                <img
                  src={rec.poster}
                  alt=""
                  className="w-14 h-20 object-cover rounded"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              ) : (
                <div className="w-14 h-20 bg-gray-700 rounded flex items-center justify-center">
                  🎬
                </div>
              )}
              <div className="flex-1">
                <p className="font-bold text-sm">{rec.title}</p>
                <p className="text-xs opacity-70">
                  {rec.director} {rec.director && rec.year && '•'} {rec.year}
                </p>
                {rec.reason && (
                  <p className="text-xs italic mt-1 text-purple-300">
                    {rec.reason}
                  </p>
                )}
                <button
                  onClick={() => handleAddRecommendation(rec)}
                  className="mt-1 px-2 py-0.5 rounded text-xs bg-purple-600 hover:bg-purple-700"
                >
                  + Add to List
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
          >
            Close
          </button>
          <button
            onClick={fetchRecommendations}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
          >
            🔄 Refresh
          </button>
        </div>
      </div>
    </div>
  )
}
