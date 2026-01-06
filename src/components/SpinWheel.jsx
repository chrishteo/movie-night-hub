import { useState, useCallback, useEffect } from 'react'
import { getAllMovies, setUserMovieStatus, sendWatchInvites } from '../lib/database'
import ParticipantSelector from './ParticipantSelector'
import { Avatar } from './AvatarPicker'
import { useToast } from './Toast'

export default function SpinWheel({
  users = [],
  onClose,
  onMoviePicked,
  onViewDetails,
  darkMode,
  authUserId = null
}) {
  const { addToast } = useToast()
  const [spinning, setSpinning] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [selectedUsers, setSelectedUsers] = useState(() =>
    users.filter(u => u.name.toLowerCase() !== 'admin').map(u => u.name)
  )
  const [prioritizeShared, setPrioritizeShared] = useState(false)
  const [allMovies, setAllMovies] = useState([])
  const [loading, setLoading] = useState(true)

  // Movie night log state
  const [showLogForm, setShowLogForm] = useState(false)
  const [logParticipants, setLogParticipants] = useState([])
  const [loggingComplete, setLoggingComplete] = useState(false)

  // Fetch all movies when component mounts (needed for accurate counts across all users)
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const movies = await getAllMovies()
        setAllMovies(movies)
      } catch (err) {
        console.error('Failed to fetch movies for spin wheel:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchMovies()
  }, [])

  // Filter movies by selected participants
  const participantMovies = selectedUsers.length > 0
    ? allMovies.filter(m => selectedUsers.includes(m.added_by))
    : allMovies

  const unwatched = participantMovies.filter(m => !m.watched)

  // Find shared movies (same title added by multiple selected users)
  const getSharedMovies = () => {
    if (selectedUsers.length < 2) return []

    // Group movies by normalized title
    const titleMap = {}
    unwatched.forEach(movie => {
      const normalizedTitle = movie.title.toLowerCase().trim()
      if (!titleMap[normalizedTitle]) {
        titleMap[normalizedTitle] = { movie, addedBy: new Set() }
      }
      titleMap[normalizedTitle].addedBy.add(movie.added_by)
    })

    // Return movies where multiple selected users added the same title
    return Object.values(titleMap)
      .filter(entry => entry.addedBy.size > 1)
      .map(entry => entry.movie)
  }

  const sharedMovies = getSharedMovies()

  const toggleUser = (userName) => {
    setSelectedUsers(prev =>
      prev.includes(userName)
        ? prev.filter(u => u !== userName)
        : [...prev, userName]
    )
  }

  const selectAllUsers = () => setSelectedUsers(
    users.filter(u => u.name.toLowerCase() !== 'admin').map(u => u.name)
  )
  const selectNoUsers = () => setSelectedUsers([])

  // Movie night log handlers
  const toggleLogParticipant = (authId) => {
    setLogParticipants(prev =>
      prev.includes(authId)
        ? prev.filter(id => id !== authId)
        : [...prev, authId]
    )
  }

  const handleLogMovieNight = async () => {
    if (!selectedMovie || logParticipants.length === 0) return

    try {
      // 1. Mark ONLY current user as watched (RLS allows this)
      const selfIncluded = logParticipants.includes(authUserId)
      if (selfIncluded && authUserId) {
        await setUserMovieStatus(selectedMovie.id, authUserId, { watched: true })
      }

      // 2. Send invites to OTHER participants (not myself)
      const otherParticipants = logParticipants.filter(id => id !== authUserId)
      if (otherParticipants.length > 0 && authUserId) {
        await sendWatchInvites(selectedMovie.id, authUserId, otherParticipants)
      }

      setLoggingComplete(true)

      // Show appropriate message
      const selfMarked = selfIncluded ? 1 : 0
      const invitesSent = otherParticipants.length

      if (selfMarked && invitesSent) {
        addToast(`Marked as watched! ${invitesSent} invite(s) sent.`, 'success')
      } else if (selfMarked) {
        addToast('Marked as watched!', 'success')
      } else if (invitesSent) {
        addToast(`${invitesSent} invite(s) sent!`, 'success')
      }
    } catch (err) {
      console.error('Error logging movie night:', err)
      addToast('Failed to log movie night', 'error')
    }
  }

  const handleStartLog = () => {
    // Pre-select participants based on who was selected for the spin
    const preSelectedAuthIds = users
      .filter(u => selectedUsers.includes(u.name) && u.auth_id && !u.is_admin)
      .map(u => u.auth_id)
    setLogParticipants(preSelectedAuthIds)
    setShowLogForm(true)
  }

  const spin = useCallback(() => {
    if (unwatched.length === 0) return

    setSpinning(true)
    setSelectedMovie(null)

    // Determine pool to pick from
    const pool = (prioritizeShared && sharedMovies.length > 0)
      ? sharedMovies
      : unwatched

    // Pick the winner upfront
    const finalPick = pool[Math.floor(Math.random() * pool.length)]

    // Fast start, smooth slowdown
    const totalSpins = 35 + Math.floor(Math.random() * 10) // 35-45 spins for longer duration
    let currentSpin = 0

    const doSpin = () => {
      currentSpin++

      if (currentSpin < totalSpins) {
        // Show random movie during spin
        setSelectedMovie(unwatched[Math.floor(Math.random() * unwatched.length)])

        // Easing: starts very fast (30ms), slows down exponentially at the end
        const progress = currentSpin / totalSpins
        // Use exponential easing - stays fast longer, then slows dramatically
        const easeOut = progress < 0.7
          ? progress * 0.3  // Stay fast for first 70%
          : 0.21 + Math.pow((progress - 0.7) / 0.3, 2) * 0.79  // Slow down last 30%
        const delay = 30 + (easeOut * 600)

        setTimeout(doSpin, delay)
      } else {
        // Show winner in the wheel first
        setSelectedMovie(finalPick)

        // Wait 1.2 seconds before announcing winner
        setTimeout(() => {
          setSpinning(false)
          onMoviePicked(finalPick)
        }, 1200)
      }
    }

    doSpin()
  }, [unwatched, sharedMovies, prioritizeShared, onMoviePicked])

  const card = darkMode ? 'bg-gray-800' : 'bg-white'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 pb-safe z-40 modal-safe-area">
      <div className={`${card} rounded-lg p-6 w-full max-w-xl max-h-[85vh] overflow-auto`}>
        <h2 className="text-xl font-bold mb-4 text-center">🎡 Spin the Wheel</h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-gray-400">Loading movies...</p>
          </div>
        ) : (
          <>
            {/* Participant Selector */}
            {users.length > 0 && (
          <ParticipantSelector
            users={users}
            selectedUsers={selectedUsers}
            onToggleUser={toggleUser}
            onSelectAll={selectAllUsers}
            onSelectNone={selectNoUsers}
            darkMode={darkMode}
            label="Whose movies to include?"
            showMovieCount={true}
            movies={allMovies}
          />
        )}

        {/* Prioritize shared movies option */}
        {selectedUsers.length >= 2 && (
          sharedMovies.length > 0 ? (
            <label className={`flex items-center gap-3 p-3 mb-4 rounded-lg cursor-pointer transition-colors ${
              prioritizeShared
                ? 'bg-purple-500/20 border border-purple-500/50'
                : darkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-100 border border-gray-300'
            }`}>
              <input
                type="checkbox"
                checked={prioritizeShared}
                onChange={(e) => setPrioritizeShared(e.target.checked)}
                className="w-4 h-4 rounded border-gray-500 text-purple-600 focus:ring-purple-500"
              />
              <div className="flex-1">
                <span className="font-medium">Prioritize shared movies</span>
                <span className="text-sm text-purple-400 ml-2">
                  ({sharedMovies.length} found)
                </span>
                <p className="text-xs text-gray-400 mt-0.5">
                  Pick from movies added by multiple people first
                </p>
              </div>
            </label>
          ) : (
            <div className={`p-3 mb-4 rounded-lg text-center ${
              darkMode ? 'bg-gray-700/30 border border-gray-700' : 'bg-gray-100 border border-gray-300'
            }`}>
              <p className="text-sm text-gray-400">
                No shared unwatched movies between selected participants
              </p>
            </div>
          )
        )}

        <div className="text-center">
          {/* Spinning display */}
          <div
            className={`w-48 h-48 md:w-64 md:h-64 mx-auto rounded-full border-8 flex items-center justify-center mb-6 overflow-hidden transition-all duration-100 ${
              spinning
                ? 'border-purple-400 shadow-lg shadow-purple-500/50 scale-105'
                : 'border-purple-600'
            }`}
          >
            {selectedMovie ? (
              <div className="p-3 flex flex-col items-center">
                {selectedMovie.poster ? (
                  <img
                    src={selectedMovie.poster}
                    alt=""
                    className="w-20 h-28 md:w-28 md:h-40 object-cover rounded-lg shadow-lg"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <div className="text-5xl md:text-6xl">🎬</div>
                )}
                <p className="font-bold text-sm md:text-base mt-2 truncate max-w-[160px] md:max-w-[220px]">
                  {selectedMovie.title}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-5xl md:text-6xl mb-2">🎰</div>
                <p className="opacity-50 text-sm">Ready to spin!</p>
              </div>
            )}
          </div>

          {/* Winner display */}
          {selectedMovie && !spinning && (
            <div className="mb-6">
              <button
                onClick={() => onViewDetails?.(selectedMovie)}
                className="w-full p-4 rounded-lg bg-green-500/20 border border-green-500/30 hover:bg-green-500/30 transition-colors cursor-pointer text-left"
              >
                <p className="text-green-400 font-bold text-xl">
                  🎉 {selectedMovie.title}!
                </p>
                <p className="text-sm text-gray-300 mt-1">
                  Added by <span className="font-medium text-purple-400">{selectedMovie.added_by || 'Unknown'}</span>
                </p>
                <p className="text-xs text-gray-400 mt-2">Click to view details</p>
              </button>

              {/* Log Movie Night section */}
              {!showLogForm && !loggingComplete && (
                <button
                  onClick={handleStartLog}
                  className="w-full mt-3 px-4 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium flex items-center justify-center gap-2"
                >
                  <span>📝</span> Log Movie Night
                </button>
              )}

              {/* Participant selection form */}
              {showLogForm && !loggingComplete && (
                <div className={`mt-3 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <p className="font-medium mb-3">Who watched the movie?</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {users.filter(u => u.auth_id && !u.is_admin).map(user => (
                      <button
                        key={user.id}
                        onClick={() => toggleLogParticipant(user.auth_id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                          logParticipants.includes(user.auth_id)
                            ? 'bg-green-600 text-white'
                            : `${darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`
                        }`}
                      >
                        <Avatar avatar={user.avatar} size="xs" />
                        <span>{user.name}</span>
                        {logParticipants.includes(user.auth_id) && <span>✓</span>}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowLogForm(false); setLogParticipants([]); }}
                      className="flex-1 px-3 py-2 rounded bg-gray-600 hover:bg-gray-500 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleLogMovieNight}
                      disabled={logParticipants.length === 0}
                      className="flex-1 px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-white text-sm disabled:opacity-50"
                    >
                      Confirm ({logParticipants.length})
                    </button>
                  </div>
                </div>
              )}

              {/* Success message */}
              {loggingComplete && (
                <div className="mt-3 p-4 rounded-lg bg-green-600/20 border border-green-500/30 text-center">
                  <p className="text-green-400 font-medium">
                    ✓ Movie night logged! All participants marked as watched.
                  </p>
                </div>
              )}
            </div>
          )}

          {unwatched.length === 0 && (
            <p className="text-yellow-400 text-sm mb-4">
              {selectedUsers.length === 0
                ? 'Select at least one person above!'
                : 'No unwatched movies to pick from!'}
            </p>
          )}
        </div>

          </>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedMovie(null)
              onClose()
            }}
            className="flex-1 px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
          >
            Close
          </button>
          {!loading && (
            <button
              onClick={spin}
              disabled={spinning || unwatched.length === 0}
              className="flex-1 px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
            >
              {spinning ? 'Spinning...' : 'Spin!'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
