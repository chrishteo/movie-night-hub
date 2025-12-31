import { useState, useEffect } from 'react'
import { getMovieOfTheWeekHistory, setMovieOfTheWeek } from '../lib/database'
import { formatDate, getRandomMovie } from '../utils/helpers'

export default function MovieOfTheWeek({
  movies,
  currentUser,
  onPick,
  onClose,
  darkMode
}) {
  const [history, setHistory] = useState([])
  const [currentMOTW, setCurrentMOTW] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const data = await getMovieOfTheWeekHistory()
      setHistory(data)
      if (data.length > 0) {
        setCurrentMOTW(data[0])
      }
    } catch (err) {
      console.error('Failed to load MOTW history:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePickNew = async () => {
    const pick = getRandomMovie(movies)
    if (!pick) return

    try {
      const entry = await setMovieOfTheWeek(pick, currentUser)
      setCurrentMOTW(entry)
      setHistory([entry, ...history.slice(0, 19)])
      onPick(pick)
    } catch (err) {
      console.error('Failed to set MOTW:', err)
    }
  }

  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const border = darkMode ? 'border-gray-700' : 'border-gray-300'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40 overflow-auto">
      <div className={`${card} rounded-lg p-4 w-full max-w-md`}>
        <h2 className="text-lg font-bold mb-4">📅 Movie of the Week</h2>

        {loading ? (
          <div className="text-center py-4 opacity-50">Loading...</div>
        ) : currentMOTW ? (
          <div className={`p-3 rounded border ${border} mb-4 flex gap-3`}>
            {currentMOTW.movie_poster ? (
              <img
                src={currentMOTW.movie_poster}
                alt=""
                className="w-20 h-28 object-cover rounded"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            ) : (
              <div className="w-20 h-28 bg-gray-700 rounded flex items-center justify-center text-2xl">
                🎬
              </div>
            )}
            <div>
              <p className="font-bold">{currentMOTW.movie_title}</p>
              <p className="text-xs opacity-70">
                Picked {formatDate(currentMOTW.picked_at)}
              </p>
              <p className="text-xs opacity-70">
                by {currentMOTW.picked_by}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-center py-4 opacity-50">
            No movie of the week yet
          </p>
        )}

        <button
          onClick={handlePickNew}
          disabled={movies.filter(m => !m.watched).length === 0}
          className="w-full px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white mb-4 disabled:opacity-50"
        >
          🎲 Pick New Movie
        </button>

        {history.length > 1 && (
          <>
            <p className="text-sm font-bold mb-2">History</p>
            <div className="space-y-1 max-h-40 overflow-auto">
              {history.slice(1).map((m, i) => (
                <div
                  key={m.id || i}
                  className="text-xs flex justify-between opacity-70"
                >
                  <span className="truncate flex-1">{m.movie_title}</span>
                  <span className="ml-2 flex-shrink-0">
                    {formatDate(m.picked_at)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
        >
          Close
        </button>
      </div>
    </div>
  )
}
