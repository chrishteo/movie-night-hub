import { useState, useCallback } from 'react'
import ParticipantSelector from './ParticipantSelector'

export default function SpinWheel({
  movies,
  users = [],
  onClose,
  onMoviePicked,
  darkMode
}) {
  const [spinning, setSpinning] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [selectedUsers, setSelectedUsers] = useState(() =>
    users.filter(u => u.name.toLowerCase() !== 'admin').map(u => u.name)
  )
  const [prioritizeShared, setPrioritizeShared] = useState(false)

  // Filter movies by selected participants
  const participantMovies = selectedUsers.length > 0
    ? movies.filter(m => selectedUsers.includes(m.added_by))
    : movies

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40">
      <div className={`${card} rounded-lg p-6 w-full max-w-xl`}>
        <h2 className="text-xl font-bold mb-4 text-center">🎡 Spin the Wheel</h2>

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
            movies={movies}
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
            <div className="mb-6 p-4 rounded-lg bg-green-500/20 border border-green-500/30">
              <p className="text-green-400 font-bold text-xl">
                🎉 {selectedMovie.title}!
              </p>
              <p className="text-sm text-gray-300 mt-1">
                Added by <span className="font-medium text-purple-400">{selectedMovie.added_by || 'Unknown'}</span>
              </p>
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
          <button
            onClick={spin}
            disabled={spinning || unwatched.length === 0}
            className="flex-1 px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
          >
            {spinning ? 'Spinning...' : 'Spin!'}
          </button>
        </div>
      </div>
    </div>
  )
}
