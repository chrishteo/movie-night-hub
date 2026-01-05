import { useState, useEffect } from 'react'
import { useToast } from './Toast'
import { getMovieNights, createMovieNight, deleteMovieNight, updateMovieNight, setUserMovieStatus, sendWatchInvites } from '../lib/database'
import { Avatar } from './AvatarPicker'

export default function MovieNightScheduler({ movies, onClose, darkMode, authUserId = null, users = [] }) {
  const { addToast } = useToast()
  const [scheduledNights, setScheduledNights] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedMovieId, setSelectedMovieId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedParticipants, setSelectedParticipants] = useState([])
  const [completingNightId, setCompletingNightId] = useState(null)
  const [completeParticipants, setCompleteParticipants] = useState([])

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

      // Update with participants if any selected
      if (selectedParticipants.length > 0) {
        await updateMovieNight(night.id, { participants: selectedParticipants })
        night.participants = selectedParticipants
      }

      setScheduledNights(prev => [...prev, night].sort((a, b) =>
        new Date(a.scheduled_date) - new Date(b.scheduled_date)
      ))
      setSelectedMovieId('')
      setSelectedDate('')
      setNotes('')
      setSelectedParticipants([])
      setShowAdd(false)
      addToast('Movie night scheduled!', 'success')
    } catch (err) {
      console.error('Error scheduling movie night:', err)
      addToast('Failed to schedule movie night', 'error')
    }
  }

  const toggleParticipant = (authId) => {
    setSelectedParticipants(prev =>
      prev.includes(authId)
        ? prev.filter(id => id !== authId)
        : [...prev, authId]
    )
  }

  const toggleCompleteParticipant = (authId) => {
    setCompleteParticipants(prev =>
      prev.includes(authId)
        ? prev.filter(id => id !== authId)
        : [...prev, authId]
    )
  }

  const handleStartComplete = (night) => {
    setCompletingNightId(night.id)
    // Pre-select participants if any were set during scheduling
    setCompleteParticipants(night.participants || [])
  }

  const handleComplete = async () => {
    if (!completingNightId || completeParticipants.length === 0) return

    const night = scheduledNights.find(n => n.id === completingNightId)
    if (!night) return

    try {
      // 1. Mark ONLY current user as watched (RLS allows this)
      const selfIncluded = completeParticipants.includes(authUserId)
      if (selfIncluded && authUserId) {
        await setUserMovieStatus(night.movie_id, authUserId, { watched: true })
      }

      // 2. Send invites to OTHER participants (not myself)
      const otherParticipants = completeParticipants.filter(id => id !== authUserId)
      if (otherParticipants.length > 0 && authUserId) {
        await sendWatchInvites(night.movie_id, authUserId, otherParticipants)
      }

      // 3. Update movie night as completed
      await updateMovieNight(completingNightId, {
        completed: true,
        completed_at: new Date().toISOString(),
        participants: completeParticipants
      })

      // Update local state
      setScheduledNights(prev => prev.map(n =>
        n.id === completingNightId
          ? { ...n, completed: true, completed_at: new Date().toISOString(), participants: completeParticipants }
          : n
      ))

      // Show appropriate message
      const invitesSent = otherParticipants.length
      if (invitesSent > 0) {
        addToast(`Movie night complete! ${invitesSent} invite(s) sent.`, 'success')
      } else {
        addToast('Movie night complete!', 'success')
      }

      setCompletingNightId(null)
      setCompleteParticipants([])
    } catch (err) {
      console.error('Error completing movie night:', err)
      addToast('Failed to complete movie night', 'error')
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40 modal-backdrop modal-safe-area">
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
                {/* Participants selection */}
                <div>
                  <label className="text-sm opacity-70 block mb-2">Who's watching? (optional)</label>
                  <div className="flex flex-wrap gap-2">
                    {users.filter(u => u.auth_id && !u.is_admin).map(user => (
                      <button
                        key={user.id}
                        onClick={() => toggleParticipant(user.auth_id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                          selectedParticipants.includes(user.auth_id)
                            ? 'bg-purple-600 text-white'
                            : `${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`
                        }`}
                      >
                        <Avatar avatar={user.avatar} size="xs" />
                        <span>{user.name}</span>
                        {selectedParticipants.includes(user.auth_id) && <span>✓</span>}
                      </button>
                    ))}
                  </div>
                  {selectedParticipants.length > 0 && (
                    <p className="text-xs opacity-60 mt-1">
                      {selectedParticipants.length} participant(s) selected
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowAdd(false); setSelectedParticipants([]); }}
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
                    {upcomingNights.filter(n => !n.completed).map(night => {
                      const movie = getMovieForNight(night)
                      const isCompleting = completingNightId === night.id
                      return (
                        <div
                          key={night.id}
                          className={`${card} border ${border} rounded-lg p-4`}
                        >
                          <div className="flex gap-4">
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
                                  {/* Show pre-selected participants if any */}
                                  {night.participants?.length > 0 && !isCompleting && (
                                    <div className="flex items-center gap-1 mt-2">
                                      <span className="text-xs opacity-60">Participants:</span>
                                      <div className="flex -space-x-1">
                                        {night.participants.slice(0, 4).map(authId => {
                                          const user = users.find(u => u.auth_id === authId)
                                          return user ? (
                                            <div key={authId} title={user.name}>
                                              <Avatar avatar={user.avatar} size="xs" />
                                            </div>
                                          ) : null
                                        })}
                                        {night.participants.length > 4 && (
                                          <span className="text-xs opacity-60 ml-2">+{night.participants.length - 4}</span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {!isCompleting && (
                                    <>
                                      <button
                                        onClick={() => handleStartComplete(night)}
                                        className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-sm"
                                      >
                                        ✓ Complete
                                      </button>
                                      <button
                                        onClick={() => handleDelete(night.id)}
                                        className="text-red-400 hover:text-red-300 text-sm"
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Complete form - select who watched */}
                          {isCompleting && (
                            <div className={`mt-4 pt-4 border-t ${border}`}>
                              <p className="text-sm font-medium mb-2">Who watched the movie?</p>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {users.filter(u => u.auth_id && !u.is_admin).map(user => (
                                  <button
                                    key={user.id}
                                    onClick={() => toggleCompleteParticipant(user.auth_id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                                      completeParticipants.includes(user.auth_id)
                                        ? 'bg-green-600 text-white'
                                        : `${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`
                                    }`}
                                  >
                                    <Avatar avatar={user.avatar} size="xs" />
                                    <span>{user.name}</span>
                                    {completeParticipants.includes(user.auth_id) && <span>✓</span>}
                                  </button>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => { setCompletingNightId(null); setCompleteParticipants([]); }}
                                  className="flex-1 px-3 py-2 rounded bg-gray-600 hover:bg-gray-500 text-sm"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleComplete}
                                  disabled={completeParticipants.length === 0}
                                  className="flex-1 px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-sm disabled:opacity-50"
                                >
                                  Mark Complete ({completeParticipants.length})
                                </button>
                              </div>
                            </div>
                          )}
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
