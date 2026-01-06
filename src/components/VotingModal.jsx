import { useState, useEffect, useCallback } from 'react'
import { getAllMovies } from '../lib/database'
import { getVoteTally, getUserVote, findWinner } from '../utils/helpers'
import { useVotingSession } from '../hooks/useVotingSessions'
import { Avatar } from './AvatarPicker'

export default function VotingModal({
  session,
  users,
  currentUser,
  authUserId,
  onEndSession,
  onCancelSession,
  onRemoveParticipant,
  onAddParticipants,
  onClose,
  onViewDetails,
  darkMode
}) {
  const {
    participants,
    votes,
    loading: sessionLoading,
    castVote,
    removeVote,
    isCreator,
    hasAccepted
  } = useVotingSession(session?.id, authUserId)

  const [allMovies, setAllMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showParticipants, setShowParticipants] = useState(false)
  const [showAddParticipant, setShowAddParticipant] = useState(false)

  // Fetch all movies when component mounts
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const movies = await getAllMovies()
        setAllMovies(movies)
      } catch (err) {
        console.error('Failed to fetch movies for voting:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchMovies()
  }, [])

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Get accepted participants' movies
  const acceptedParticipants = participants.filter(p => p.status === 'accepted')
  const acceptedUserNames = acceptedParticipants
    .map(p => users.find(u => u.auth_id === p.user_id)?.name)
    .filter(Boolean)

  // Filter movies by accepted participants
  const participantMovies = acceptedUserNames.length > 0
    ? allMovies.filter(m => acceptedUserNames.includes(m.added_by))
    : allMovies

  const unwatched = participantMovies.filter(m => !m.watched)

  const handleDeclareWinner = async () => {
    const winner = findWinner(participantMovies, votes, users)
    if (winner && session) {
      await onEndSession(session.id, winner.id)
      // Show winner details
      if (onViewDetails) {
        onViewDetails(winner)
      }
    }
  }

  const handleCancelSession = async () => {
    if (session && confirm('Are you sure you want to cancel this voting session?')) {
      await onCancelSession(session.id)
      onClose()
    }
  }

  // Get users not yet in this session for adding
  const availableUsers = users.filter(u =>
    u.name.toLowerCase() !== 'admin' &&
    u.auth_id &&
    !participants.some(p => p.user_id === u.auth_id)
  )

  const handleAddParticipant = async (user) => {
    if (user.auth_id && session) {
      await onAddParticipants(session.id, [user.auth_id])
      setShowAddParticipant(false)
    }
  }

  const handleRemoveParticipant = async (userId) => {
    if (session && confirm('Remove this participant from the session?')) {
      await onRemoveParticipant(session.id, userId)
    }
  }

  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const cardInner = darkMode ? 'bg-gray-700' : 'bg-gray-100'
  const border = darkMode ? 'border-gray-700' : 'border-gray-300'

  const isLoading = loading || sessionLoading

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-auto modal-safe-area"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={`${card} rounded-lg p-4 w-full max-w-lg max-h-[85vh] overflow-auto`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold">🗳️ {session?.name || 'Voting'}</h2>
            {!hasAccepted && !isCreator && (
              <p className="text-xs text-yellow-400">You need to accept the invite to vote</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-500/30 rounded-full transition-colors"
            title="Close (Esc)"
          >
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : (
          <>
            {/* Participants Section */}
            <div className={`${cardInner} rounded-lg p-3 mb-4 border ${border}`}>
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className="w-full flex items-center justify-between"
              >
                <span className="text-sm font-medium">
                  Participants ({acceptedParticipants.length}/{participants.length})
                </span>
                <span className="text-gray-400">{showParticipants ? '▼' : '▶'}</span>
              </button>

              {showParticipants && (
                <div className="mt-3 space-y-2">
                  {participants.map(p => {
                    const user = users.find(u => u.auth_id === p.user_id)
                    if (!user) return null

                    return (
                      <div key={p.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar avatar={user.avatar} size="sm" />
                          <span className="text-sm">{user.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            p.status === 'accepted'
                              ? 'bg-green-500/20 text-green-400'
                              : p.status === 'declined'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {p.status}
                          </span>
                        </div>
                        {isCreator && p.user_id !== authUserId && (
                          <button
                            onClick={() => handleRemoveParticipant(p.user_id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                            title="Remove participant"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )
                  })}

                  {/* Add participant button (creator only) */}
                  {isCreator && availableUsers.length > 0 && (
                    <>
                      {!showAddParticipant ? (
                        <button
                          onClick={() => setShowAddParticipant(true)}
                          className="text-sm text-purple-400 hover:text-purple-300"
                        >
                          + Add participant
                        </button>
                      ) : (
                        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-600">
                          {availableUsers.map(user => (
                            <button
                              key={user.id}
                              onClick={() => handleAddParticipant(user)}
                              className="flex items-center gap-1 px-2 py-1 rounded bg-gray-600 hover:bg-gray-500 text-xs"
                            >
                              <Avatar avatar={user.avatar} size="xs" />
                              {user.name}
                            </button>
                          ))}
                          <button
                            onClick={() => setShowAddParticipant(false)}
                            className="px-2 py-1 rounded bg-gray-600 hover:bg-gray-500 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Voting instructions */}
            {hasAccepted && (
              <p className="text-xs text-gray-400 mb-3 text-center">
                Voting on movies from: {acceptedUserNames.join(', ') || 'no one yet'}
              </p>
            )}

            {/* Movie list */}
            {unwatched.length === 0 ? (
              <p className="text-center py-8 opacity-50">No unwatched movies to vote on</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
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
                          className="w-10 h-14 object-cover rounded cursor-pointer hover:opacity-80"
                          onClick={() => onViewDetails?.(movie)}
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      ) : (
                        <div
                          className="w-10 h-14 bg-gray-700 rounded flex items-center justify-center cursor-pointer hover:bg-gray-600"
                          onClick={() => onViewDetails?.(movie)}
                        >
                          🎬
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-bold text-sm truncate cursor-pointer hover:text-purple-400"
                          onClick={() => onViewDetails?.(movie)}
                        >
                          {movie.title}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={() => {
                              if (!hasAccepted && !isCreator) return
                              if (myVote === 'yes') {
                                removeVote(movie.id, currentUser)
                              } else {
                                castVote(movie.id, currentUser, 'yes')
                              }
                            }}
                            disabled={!hasAccepted && !isCreator}
                            className={`px-2 py-0.5 rounded text-xs transition-all ${
                              myVote === 'yes'
                                ? 'bg-green-600 ring-2 ring-green-400'
                                : 'bg-gray-600 hover:bg-gray-500'
                            } ${(!hasAccepted && !isCreator) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={myVote === 'yes' ? 'Click to remove vote' : 'Vote yes'}
                          >
                            👍
                          </button>
                          <button
                            onClick={() => {
                              if (!hasAccepted && !isCreator) return
                              if (myVote === 'no') {
                                removeVote(movie.id, currentUser)
                              } else {
                                castVote(movie.id, currentUser, 'no')
                              }
                            }}
                            disabled={!hasAccepted && !isCreator}
                            className={`px-2 py-0.5 rounded text-xs transition-all ${
                              myVote === 'no'
                                ? 'bg-red-600 ring-2 ring-red-400'
                                : 'bg-gray-600 hover:bg-gray-500'
                            } ${(!hasAccepted && !isCreator) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={myVote === 'no' ? 'Click to remove vote' : 'Vote no'}
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

            {/* Action buttons */}
            <div className="mt-4 space-y-2">
              <button
                onClick={handleDeclareWinner}
                disabled={unwatched.length === 0 || (!hasAccepted && !isCreator)}
                className="w-full px-4 py-2 rounded bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-50"
              >
                🏆 Declare Winner
              </button>

              {isCreator && (
                <button
                  onClick={handleCancelSession}
                  className="w-full px-4 py-2 rounded bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm"
                >
                  Cancel Session
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
