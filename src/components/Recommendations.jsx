import { useState, useEffect } from 'react'
import { getRecommendations } from '../lib/api'

export default function Recommendations({
  movies,
  currentUser,
  onAddMovie,
  onClose,
  darkMode
}) {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchRecommendations = async () => {
    setLoading(true)
    setError('')

    try {
      const recs = await getRecommendations(movies)
      setRecommendations(recs)
    } catch (err) {
      setError(err.message || 'Failed to get recommendations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [])

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
        favorite: false,
        added_by: currentUser,
        notes: rec.reason || ''
      })
    } catch (err) {
      console.error('Failed to add recommendation:', err)
    }
  }

  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const border = darkMode ? 'border-gray-700' : 'border-gray-300'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40 overflow-auto">
      <div className={`${card} rounded-lg p-4 w-full max-w-lg max-h-[90vh] overflow-auto`}>
        <h2 className="text-lg font-bold mb-4">💡 AI Recommendations</h2>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin text-3xl">🎬</div>
            <p className="mt-2 opacity-70">Analyzing your collection...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && recommendations.length === 0 && (
          <p className="text-center py-8 opacity-50">
            No recommendations available
          </p>
        )}

        <div className="space-y-2">
          {recommendations.map((rec, i) => (
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
