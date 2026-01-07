import { useState, useEffect, useMemo } from 'react'
import { useToast } from './Toast'
import { getMovieNights, createMovieNight, deleteMovieNight, updateMovieNight, setUserMovieStatus, sendWatchInvites } from '../lib/database'
import { Avatar } from './AvatarPicker'

export default function MovieNightScheduler({
  movies,
  onClose,
  darkMode,
  authUserId = null,
  users = [],
  preSelectedMovie = null,
  onClearPreSelected,
  isAdmin = false
}) {
  const { addToast } = useToast()
  const [scheduledNights, setScheduledNights] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedMovieId, setSelectedMovieId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('19:00')
  const [notes, setNotes] = useState('')
  const [selectedParticipants, setSelectedParticipants] = useState([])
  const [completingNightId, setCompletingNightId] = useState(null)
  const [completeParticipants, setCompleteParticipants] = useState([])

  // Edit mode state
  const [editingNight, setEditingNight] = useState(null)

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null)

  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const border = darkMode ? 'border-gray-700' : 'border-gray-300'
  const input = darkMode ? 'bg-gray-700' : 'bg-gray-100'

  useEffect(() => {
    fetchScheduledNights()
  }, [])

  // Handle pre-selected movie from Spin Wheel or Voting Modal
  useEffect(() => {
    if (preSelectedMovie) {
      setSelectedMovieId(preSelectedMovie.id)
      setShowAddForm(true)
      // Set default date to today
      setSelectedDate(new Date().toISOString().split('T')[0])
    }
  }, [preSelectedMovie])

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

  const resetForm = () => {
    setSelectedMovieId('')
    setSelectedDate('')
    setSelectedTime('19:00')
    setNotes('')
    setSelectedParticipants([])
    setShowAddForm(false)
    setEditingNight(null)
    if (onClearPreSelected) onClearPreSelected()
  }

  const handleSchedule = async () => {
    if (!selectedMovieId || !selectedDate) return
    const movie = movies.find(m => m.id === selectedMovieId)
    if (!movie) return

    try {
      if (editingNight) {
        // Update existing movie night
        const updates = {
          movie_id: selectedMovieId,
          movie_title: movie.title,
          scheduled_date: selectedDate,
          scheduled_time: selectedTime || null,
          notes,
          participants: selectedParticipants.length > 0 ? selectedParticipants : null
        }

        await updateMovieNight(editingNight.id, updates)

        setScheduledNights(prev => prev.map(n =>
          n.id === editingNight.id
            ? { ...n, ...updates }
            : n
        ).sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date)))

        addToast('Movie night updated!', 'success')
      } else {
        // Create new movie night
        const night = await createMovieNight(
          movie.id,
          movie.title,
          selectedDate,
          notes,
          authUserId,
          selectedTime || null
        )

        // Update with participants if any selected
        if (selectedParticipants.length > 0) {
          await updateMovieNight(night.id, { participants: selectedParticipants })
          night.participants = selectedParticipants
        }

        setScheduledNights(prev => [...prev, night].sort((a, b) =>
          new Date(a.scheduled_date) - new Date(b.scheduled_date)
        ))
        addToast('Movie night scheduled!', 'success')
      }

      resetForm()
    } catch (err) {
      console.error('Error scheduling movie night:', err)
      addToast('Failed to schedule movie night', 'error')
    }
  }

  const handleEdit = (night) => {
    setEditingNight(night)
    setSelectedMovieId(night.movie_id)
    setSelectedDate(night.scheduled_date)
    setSelectedTime(night.scheduled_time || '19:00')
    setNotes(night.notes || '')
    setSelectedParticipants(night.participants || [])
    setShowAddForm(true)
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
    setCompleteParticipants(night.participants || [])
  }

  const handleComplete = async () => {
    if (!completingNightId || completeParticipants.length === 0) return

    const night = scheduledNights.find(n => n.id === completingNightId)
    if (!night) return

    try {
      const selfIncluded = completeParticipants.includes(authUserId)
      if (selfIncluded && authUserId) {
        await setUserMovieStatus(night.movie_id, authUserId, { watched: true })
      }

      const otherParticipants = completeParticipants.filter(id => id !== authUserId)
      if (otherParticipants.length > 0 && authUserId) {
        await sendWatchInvites(night.movie_id, authUserId, otherParticipants)
      }

      await updateMovieNight(completingNightId, {
        completed: true,
        completed_at: new Date().toISOString(),
        participants: completeParticipants
      })

      setScheduledNights(prev => prev.map(n =>
        n.id === completingNightId
          ? { ...n, completed: true, completed_at: new Date().toISOString(), participants: completeParticipants }
          : n
      ))

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
      addToast('Movie night cancelled', 'success')
    } catch (err) {
      console.error('Error deleting movie night:', err)
      addToast('Failed to cancel movie night', 'error')
    }
  }

  const formatDate = (dateStr, timeStr = null) => {
    const date = new Date(dateStr + 'T00:00:00')
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    let dateFormatted
    if (date.toDateString() === today.toDateString()) {
      dateFormatted = 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dateFormatted = 'Tomorrow'
    } else {
      dateFormatted = date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    }

    if (timeStr) {
      const [hours, minutes] = timeStr.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const hour12 = hour % 12 || 12
      dateFormatted += ` @ ${hour12}:${minutes} ${ampm}`
    }

    return dateFormatted
  }

  const isUpcoming = (dateStr) => {
    return new Date(dateStr) >= new Date(new Date().setHours(0, 0, 0, 0))
  }

  const upcomingNights = scheduledNights.filter(n => isUpcoming(n.scheduled_date) && !n.completed)
  const pastNights = scheduledNights.filter(n => !isUpcoming(n.scheduled_date) || n.completed)

  const getMovieForNight = (night) => {
    return movies.find(m => m.id === night.movie_id)
  }

  // Check if current user can modify a scheduled night (creator or admin)
  const canModifyNight = (night) => {
    // Admin can modify anything
    if (isAdmin) return true
    // Creator can modify their own
    if (night.user_id && night.user_id === authUserId) return true
    // If no user_id set (legacy data), allow the current user to modify
    if (!night.user_id) return true
    return false
  }

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days = []
    // Add empty slots for days before the first of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }
    // Add all days in the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  const calendarDays = useMemo(() => getDaysInMonth(currentMonth), [currentMonth])

  const nightsOnDate = useMemo(() => {
    const map = {}
    scheduledNights.forEach(night => {
      const dateKey = night.scheduled_date
      if (!map[dateKey]) map[dateKey] = []
      map[dateKey].push(night)
    })
    return map
  }, [scheduledNights])

  const isToday = (date) => {
    if (!date) return false
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isPastDate = (date) => {
    if (!date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const formatDateKey = (date) => {
    if (!date) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleDayClick = (date) => {
    if (!date || isPastDate(date)) return
    const dateKey = formatDateKey(date)
    setSelectedCalendarDate(dateKey)

    // If clicking on a date with no events, open the add form with that date
    if (!nightsOnDate[dateKey] || nightsOnDate[dateKey].length === 0) {
      setSelectedDate(dateKey)
      setShowAddForm(true)
    }
  }

  const prevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const monthYearStr = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Get events for selected calendar date
  const selectedDateEvents = selectedCalendarDate ? (nightsOnDate[selectedCalendarDate] || []) : []

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
          {/* Add/Schedule button */}
          <button
            onClick={() => {
              if (showAddForm && !editingNight) {
                resetForm()
              } else {
                setEditingNight(null)
                setShowAddForm(true)
                setSelectedDate(selectedCalendarDate || new Date().toISOString().split('T')[0])
              }
            }}
            className={`w-full px-4 py-3 rounded mb-4 font-medium transition-colors ${
              showAddForm && !editingNight
                ? 'bg-gray-600 hover:bg-gray-500'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {showAddForm && !editingNight ? '✕ Cancel' : '+ Schedule Movie Night'}
          </button>

          {/* Add/Edit form */}
          {showAddForm && (
            <div className={`${card} border ${border} rounded-lg p-4 mb-4`}>
              <h3 className="font-bold mb-3">
                {editingNight ? 'Edit Movie Night' : 'Schedule Movie Night'}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm opacity-70 block mb-1">Movie</label>
                  <select
                    value={selectedMovieId}
                    onChange={(e) => setSelectedMovieId(e.target.value)}
                    className={`w-full px-3 py-2 rounded ${input} border ${border}`}
                  >
                    <option value="">Select a movie...</option>
                    {/* Include pre-selected movie even if watched, then all unwatched movies */}
                    {preSelectedMovie && !movies.filter(m => !m.watched).some(m => m.id === preSelectedMovie.id) && (
                      <option key={preSelectedMovie.id} value={preSelectedMovie.id}>
                        {preSelectedMovie.title} (selected)
                      </option>
                    )}
                    {movies.filter(m => !m.watched).map(m => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                    <label className="text-sm opacity-70 block mb-1">Time</label>
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className={`w-full px-3 py-2 rounded ${input} border ${border}`}
                    >
                      {/* Generate time options in 30-min intervals (24-hour format) */}
                      {Array.from({ length: 48 }, (_, i) => {
                        const hour24 = Math.floor(i / 2)
                        const minutes = i % 2 === 0 ? '00' : '30'
                        const value = `${String(hour24).padStart(2, '0')}:${minutes}`
                        return (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        )
                      })}
                    </select>
                  </div>
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
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSchedule}
                    disabled={!selectedMovieId || !selectedDate}
                    className="flex-1 px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  >
                    {editingNight ? 'Save Changes' : 'Schedule'}
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
              {/* Calendar View */}
              <div className={`${card} border ${border} rounded-lg p-4 mb-4`}>
                {/* Month navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={prevMonth}
                    className="p-2 hover:bg-gray-600 rounded transition-colors"
                  >
                    ◀
                  </button>
                  <h3 className="font-bold">{monthYearStr}</h3>
                  <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-gray-600 rounded transition-colors"
                  >
                    ▶
                  </button>
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="font-bold opacity-70 py-1">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((date, idx) => {
                    if (!date) {
                      return <div key={`empty-${idx}`} className="h-10" />
                    }

                    const dateKey = formatDateKey(date)
                    const hasEvents = nightsOnDate[dateKey]?.length > 0
                    const isSelected = selectedCalendarDate === dateKey
                    const past = isPastDate(date)
                    const today = isToday(date)

                    return (
                      <button
                        key={dateKey}
                        onClick={() => handleDayClick(date)}
                        disabled={past}
                        className={`h-10 rounded relative transition-colors text-sm ${
                          past
                            ? 'opacity-30 cursor-not-allowed'
                            : isSelected
                              ? 'bg-purple-600 text-white'
                              : today
                                ? 'bg-purple-500/30 hover:bg-purple-500/50'
                                : 'hover:bg-gray-600'
                        }`}
                      >
                        {date.getDate()}
                        {hasEvents && (
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-green-400 rounded-full" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Selected date events */}
              {selectedCalendarDate && selectedDateEvents.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold mb-2 opacity-70">
                    {formatDate(selectedCalendarDate)}
                  </h4>
                  <div className="space-y-2">
                    {selectedDateEvents.map(night => {
                      const movie = getMovieForNight(night)
                      return (
                        <div
                          key={night.id}
                          className={`${card} border ${border} rounded-lg p-3 flex gap-3 items-center`}
                        >
                          {movie?.poster ? (
                            <img src={movie.poster} alt="" className="w-12 h-16 object-cover rounded" />
                          ) : (
                            <div className="w-12 h-16 bg-gray-700 rounded flex items-center justify-center">🎬</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold truncate">{night.movie_title}</p>
                            <p className="text-sm text-purple-400">
                              {night.scheduled_time ? formatDate(night.scheduled_date, night.scheduled_time) : formatDate(night.scheduled_date)}
                            </p>
                            {night.notes && <p className="text-xs opacity-60 truncate">{night.notes}</p>}
                          </div>
                          {!night.completed && canModifyNight(night) && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(night)}
                                className="p-2 rounded hover:bg-gray-600 text-sm"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDelete(night.id)}
                                className="p-2 rounded hover:bg-red-600/30 text-red-400 text-sm"
                                title="Cancel"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

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
                                    {night.scheduled_time
                                      ? formatDate(night.scheduled_date, night.scheduled_time)
                                      : formatDate(night.scheduled_date)}
                                  </p>
                                  {night.notes && (
                                    <p className="text-sm opacity-70 mt-1">{night.notes}</p>
                                  )}
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
                                      {canModifyNight(night) && (
                                        <button
                                          onClick={() => handleEdit(night)}
                                          className="px-3 py-1 rounded bg-gray-600 hover:bg-gray-500 text-sm"
                                          title="Edit"
                                        >
                                          ✏️
                                        </button>
                                      )}
                                      <button
                                        onClick={() => handleStartComplete(night)}
                                        className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-sm"
                                      >
                                        ✓ Complete
                                      </button>
                                      {canModifyNight(night) && (
                                        <button
                                          onClick={() => handleDelete(night.id)}
                                          className="text-red-400 hover:text-red-300 text-sm"
                                        >
                                          Cancel
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Complete form */}
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
                    {pastNights.slice(0, 10).map(night => (
                      <div
                        key={night.id}
                        className={`${card} border ${border} rounded p-3 flex items-center gap-3 opacity-50`}
                      >
                        <span className="text-xl">✓</span>
                        <div className="flex-1">
                          <p className="font-medium">{night.movie_title}</p>
                          <p className="text-xs">
                            {night.scheduled_time
                              ? formatDate(night.scheduled_date, night.scheduled_time)
                              : formatDate(night.scheduled_date)}
                          </p>
                        </div>
                        {canModifyNight(night) && (
                          <button
                            onClick={() => handleDelete(night.id)}
                            className="p-1.5 rounded hover:bg-red-600/30 text-red-400 text-sm"
                            title="Remove from history"
                          >
                            🗑️
                          </button>
                        )}
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
