import { useState, useEffect } from 'react'
import { useToast } from './Toast'
import { getMovieNights, createMovieNight, deleteMovieNight } from '../lib/database'

export default function MovieNightScheduler({ movies, onClose, darkMode, authUserId = null }) {
  const { addToast } = useToast()
  const [scheduledNights, setScheduledNights] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedMovieId, setSelectedMovieId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [notes, setNotes] = useState('')

  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const border = darkMode ? 'border-gray-700' : 'border-gray-300'
  const input = darkMode ? 'bg-gray-700' : 'bg-gray-100'

  useEffect(() => {
    fetchScheduledNights()
  }, [])

  const fetchScheduledNights = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getMovieNights()
      setScheduledNights(data || [])
    } catch (err) {
      console.error('Error fetching movie nights:', err)
      setError('Failed to load scheduled nights')
      addToast('Failed to load scheduled nights', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSchedule = async () => {
    if (!selectedMovieId || !selectedDate) return
    const movie = movies.find(m => m.id === selectedMovieId)
    if (!movie) return

    try {
      // Pass authUserId for RLS security
      const night = await createMovieNight(movie.id, movie.title, selectedDate, notes, authUserId)
      setScheduledNights(prev => [...prev, night].sort((a, b) =>
        new Date(a.scheduled_date) - new Date(b.scheduled_date)
      ))
      setSelectedMovieId('')
      setSelectedDate('')
      setNotes('')
      setShowAdd(false)
    } catch (err) {
      console.error('Error scheduling movie night:', err)
      addToast('Failed to schedule movie night', 'error')
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteMovieNight(id)
      setScheduledNights(prev => prev.filter(n => n.id !== id))
    } catch (err) {
      console.error('Error deleting movie night:', err)
      addToast('Failed to cancel movie night', 'error')
    }
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const isUpcoming = (dateStr) => {
    return new Date(dateStr) >= new Date(new Date().setHours(0, 0, 0, 0))
  }

  const upcomingNights = scheduledNights.filter(n => isUpcoming(n.scheduled_date))
  const pastNights = scheduledNights.filter(n => !isUpcoming(n.scheduled_date))

  // Get movie details for a scheduled night
  const getMovieForNight = (night) => {
    return movies.find(m => m.id === night.movie_id)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40 modal-backdrop">
      <div className={`${card} rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col modal-content`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📅</span>
            <h2 className="text-xl font-bold">Movie Night Scheduler</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Add new button */}
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="w-full px-4 py-3 rounded bg-purple-600 hover:bg-purple-700 text-white mb-4"
          >
            + Schedule Movie Night
          </button>

          {/* Add form */}
          {showAdd && (
            <div className={`${card} border ${border} rounded-lg p-4 mb-4`}>
              <div className="space-y-3">
                <div>
                  <label className="text-sm opacity-70 block mb-1">Movie</label>
                  <select
                    value={selectedMovieId}
                    onChange={(e) => setSelectedMovieId(e.target.value)}
                    className={`w-full px-3 py-2 rounded ${input} border ${border}`}
                  >
                    <option value="">Select a movie...</option>
                    {movies.filter(m => !m.watched).map(m => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm opacity-70 block mb-1">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-3 py-2 rounded ${input} border ${border}`}
                  />
                </div>
                <div>
                  <label className="text-sm opacity-70 block mb-1">Notes (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., Snacks: popcorn, pizza"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={`w-full px-3 py-2 rounded ${input} border ${border}`}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAdd(false)}
                    className="flex-1 px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSchedule}
                    disabled={!selectedMovieId || !selectedDate}
                    className="flex-1 px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  >
                    Schedule
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <span className="animate-spin text-3xl">🎬</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-sm text-red-400 mb-3">{error}</p>
              <button
                onClick={fetchScheduledNights}
                className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Upcoming */}
              <div className="mb-6">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <span>🎯</span> Upcoming
                </h3>
                {upcomingNights.length === 0 ? (
                  <p className="text-sm opacity-50">No movie nights scheduled</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingNights.map(night => {
                      const movie = getMovieForNight(night)
                      return (
                        <div
                          key={night.id}
                          className={`${card} border ${border} rounded-lg p-4 flex gap-4`}
                        >
                          {movie?.poster ? (
                            <img
                              src={movie.poster}
                              alt=""
                              className="w-16 h-24 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-24 bg-gray-700 rounded flex items-center justify-center text-2xl">
                              🎬
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-bold">{night.movie_title}</h4>
                                <p className="text-purple-400 font-medium">
                                  {formatDate(night.scheduled_date)}
                                </p>
                                {night.notes && (
                                  <p className="text-sm opacity-70 mt-1">{night.notes}</p>
                                )}
                              </div>
                              <button
                                onClick={() => handleDelete(night.id)}
                                className="text-red-400 hover:text-red-300 text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Past */}
              {pastNights.length > 0 && (
                <div>
                  <h3 className="font-bold mb-3 flex items-center gap-2 opacity-50">
                    <span>📜</span> Past
                  </h3>
                  <div className="space-y-2">
                    {pastNights.slice(0, 5).map(night => (
                      <div
                        key={night.id}
                        className={`${card} border ${border} rounded p-3 flex items-center gap-3 opacity-50`}
                      >
                        <span className="text-xl">✓</span>
                        <div className="flex-1">
                          <p className="font-medium">{night.movie_title}</p>
                          <p className="text-xs">{formatDate(night.scheduled_date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
