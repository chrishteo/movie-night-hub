import { useState } from 'react'
import { getVoteTally, getUserVote, findWinner } from '../utils/helpers'
import ParticipantSelector from './ParticipantSelector'

export default function VotingModal({
  movies,
  votes,
  users,
  currentUser,
  onVote,
  onDeclareWinner,
  onClose,
  darkMode
}) {
  const [selectedUsers, setSelectedUsers] = useState(() => users.map(u => u.name))

  // Filter movies by selected participants
  const participantMovies = selectedUsers.length > 0
    ? movies.filter(m => selectedUsers.includes(m.added_by))
    : movies

  const unwatched = participantMovies.filter(m => !m.watched)

  const toggleUser = (userName) => {
    setSelectedUsers(prev =>
      prev.includes(userName)
        ? prev.filter(u => u !== userName)
        : [...prev, userName]
    )
  }

  const selectAllUsers = () => setSelectedUsers(users.map(u => u.name))
  const selectNoUsers = () => setSelectedUsers([])

  const handleDeclareWinner = () => {
    // Find winner from participant movies only
    const winner = findWinner(participantMovies, votes, users)
    if (winner) {
      onDeclareWinner(winner)
    }
  }

  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const border = darkMode ? 'border-gray-700' : 'border-gray-300'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40 overflow-auto">
      <div className={`${card} rounded-lg p-4 w-full max-w-lg max-h-[90vh] overflow-auto`}>
        <h2 className="text-lg font-bold mb-2">
          🗳️ Vote as {currentUser}
        </h2>

        {/* Participant Selector */}
        {users.length > 0 && (
          <ParticipantSelector
            users={users}
            selectedUsers={selectedUsers}
            onToggleUser={toggleUser}
            onSelectAll={selectAllUsers}
            onSelectNone={selectNoUsers}
            darkMode={darkMode}
            label="Whose movies to vote on?"
            showMovieCount={true}
            movies={movies}
          />
        )}

        {unwatched.length === 0 ? (
          <p className="text-center py-8 opacity-50">No unwatched movies to vote on</p>
        ) : (
          <div className="space-y-2">
            {unwatched.map(movie => {
              const tally = getVoteTally(votes, movie.id, users)
              const myVote = getUserVote(votes, movie.id, currentUser)

              return (
                <div
                  key={movie.id}
                  className={`p-2 rounded border ${border} flex gap-2 items-center`}
                >
                  {movie.poster ? (
                    <img
                      src={movie.poster}
                      alt=""
                      className="w-10 h-14 object-cover rounded"
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  ) : (
                    <div className="w-10 h-14 bg-gray-700 rounded flex items-center justify-center">
                      🎬
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{movie.title}</p>
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => onVote(movie.id, currentUser, 'yes')}
                        className={`px-2 py-0.5 rounded text-xs ${
                          myVote === 'yes'
                            ? 'bg-green-600'
                            : 'bg-gray-600 hover:bg-gray-500'
                        }`}
                      >
                        👍
                      </button>
                      <button
                        onClick={() => onVote(movie.id, currentUser, 'no')}
                        className={`px-2 py-0.5 rounded text-xs ${
                          myVote === 'no'
                            ? 'bg-red-600'
                            : 'bg-gray-600 hover:bg-gray-500'
                        }`}
                      >
                        👎
                      </button>
                    </div>
                  </div>
                  <div className="text-xs">
                    <span className="text-green-400">{tally.yes}</span>
                    /
                    <span className="text-red-400">{tally.no}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
          >
            Close
          </button>
          <button
            onClick={handleDeclareWinner}
            disabled={unwatched.length === 0}
            className="flex-1 px-4 py-2 rounded bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-50"
          >
            🏆 Winner
          </button>
        </div>
      </div>
    </div>
  )
}
