import { useState, useEffect, useCallback, useMemo } from 'react'
import { getAllMovies } from '../lib/database'
import { getVoteTally, getUserVote } from '../utils/helpers'
import { useVotingSession } from '../hooks/useVotingSessions'
import { Avatar } from './AvatarPicker'

export default function VotingModal({
  session,
  users,
  currentUser,
  authUserId,
  onEndSession,
  onCancelSession,
  onLeaveSession,
  onRemoveParticipant,
  onAddParticipants,
  onClose,
  onViewDetails,
  onScheduleMovie,
  darkMode
}) {
  const {
    participants,
    votes,
    sessionMovies,
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

  // Voting phase: 'voting' | 'runoff' | 'complete'
  const [votingPhase, setVotingPhase] = useState('voting')
  const [runoffMovies, setRunoffMovies] = useState([]) // Movies in runoff (tied)
  const [runoffRound, setRunoffRound] = useState(0) // Track runoff rounds
  const [runoffVoteCount, setRunoffVoteCount] = useState(0) // Track votes cast in current runoff
  const [winnerMovie, setWinnerMovie] = useState(null) // The winning movie
  const [wasRandomWinner, setWasRandomWinner] = useState(false) // Whether winner was random

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

  // Get accepted participants
  const acceptedParticipants = participants.filter(p => p.status === 'accepted')
  const acceptedUserNames = acceptedParticipants
    .map(p => users.find(u => u.auth_id === p.user_id)?.name)
    .filter(Boolean)

  // Get movies selected for this session (from voting_session_movies table)
  const selectedMovies = useMemo(() => {
    if (!sessionMovies || sessionMovies.length === 0) return []
    return sessionMovies
      .map(sm => {
        const movie = allMovies.find(m => m.id === sm.movie_id)
        if (movie) {
          // Attach who selected this movie
          const selector = users.find(u => u.auth_id === sm.selected_by)
          return { ...movie, selectedBy: selector?.name || 'Unknown' }
        }
        return null
      })
      .filter(Boolean)
  }, [sessionMovies, allMovies, users])

  // Movies to show based on voting phase
  const moviesToVote = votingPhase === 'runoff' ? runoffMovies : selectedMovies

  // Calculate voting progress for accepted participants only
  const votingProgress = useMemo(() => {
    if (acceptedUserNames.length === 0 || moviesToVote.length === 0) {
      return { complete: false, voted: 0, total: 0, byUser: {} }
    }

    const byUser = {}
    let totalVotes = 0
    const totalNeeded = acceptedUserNames.length * moviesToVote.length

    acceptedUserNames.forEach(userName => {
      const userVotes = moviesToVote.filter(movie =>
        votes.some(v => v.movie_id === movie.id && v.user_name === userName)
      ).length
      byUser[userName] = { voted: userVotes, total: moviesToVote.length }
      totalVotes += userVotes
    })

    return {
      complete: totalVotes >= totalNeeded,
      voted: totalVotes,
      total: totalNeeded,
      byUser
    }
  }, [acceptedUserNames, moviesToVote, votes])

  // Find winners (movies with highest score) - returns array for tie detection
  const findWinners = useCallback((movieList = moviesToVote) => {
    if (movieList.length === 0) return []

    const scores = movieList.map(movie => {
      const tally = getVoteTally(votes, movie.id, users)
      return { movie, score: tally.yes - tally.no, yes: tally.yes, no: tally.no }
    })

    const maxScore = Math.max(...scores.map(s => s.score))
    return scores.filter(s => s.score === maxScore)
  }, [moviesToVote, votes, users])

  // Show winner celebration (doesn't end session)
  const handleAutoWinner = useCallback((movie, wasRandom = false) => {
    setWinnerMovie(movie)
    setWasRandomWinner(wasRandom)
    setVotingPhase('complete')
  }, [])

  // Start a runoff with tied movies - clear their votes first
  const startRunoff = useCallback(async (tiedMovies) => {
    // Clear votes for tied movies so participants can revote
    for (const { movie } of tiedMovies) {
      for (const userName of acceptedUserNames) {
        try {
          await removeVote(movie.id, userName)
        } catch (e) {
          // Vote might not exist, that's ok
        }
      }
    }

    setRunoffMovies(tiedMovies.map(w => w.movie))
    setVotingPhase('runoff')
    setRunoffRound(prev => prev + 1)
    setRunoffVoteCount(0)
  }, [acceptedUserNames, removeVote])

  // Auto-check for winner when all votes are cast
  useEffect(() => {
    // Don't check if already complete or not enough participants
    if (votingPhase === 'complete') return
    if (acceptedParticipants.length < 2) return
    if (!votingProgress.complete) return

    const winners = findWinners()

    if (winners.length === 0) return

    if (winners.length === 1) {
      // Clear winner - auto-declare
      handleAutoWinner(winners[0].movie)
    } else if (winners.length > 1) {
      if (votingPhase === 'runoff') {
        // Already in runoff and still tied - pick random
        const randomWinner = winners[Math.floor(Math.random() * winners.length)]
        handleAutoWinner(randomWinner.movie, true)
      } else {
        // Start runoff with tied movies
        startRunoff(winners)
      }
    }
  }, [votingProgress.complete, votingPhase, acceptedParticipants.length, findWinners, startRunoff, handleAutoWinner])

  const handleViewWinnerDetails = () => {
    if (winnerMovie && onViewDetails) {
      onViewDetails(winnerMovie)
    }
  }

  // Finalize and end the session (called when user confirms)
  const handleFinalizeWinner = async () => {
    if (session && winnerMovie) {
      try {
        await onEndSession(session.id, winnerMovie.id)
        onClose()
      } catch (err) {
        console.error('Failed to end session:', err)
      }
    }
  }

  const handleDeclareWinner = async () => {
    const winners = findWinners()
    if (winners.length === 0) return

    let winner
    let isRandom = false
    if (winners.length === 1) {
      winner = winners[0].movie
    } else {
      // Multiple winners (tie) - pick random
      winner = winners[Math.floor(Math.random() * winners.length)].movie
      isRandom = true
    }

    if (winner && session) {
      await handleAutoWinner(winner, isRandom)
    }
  }

  const handleCancelSession = async () => {
    if (session && confirm('Are you sure you want to cancel this voting session?')) {
      await onCancelSession(session.id)
      onClose()
    }
  }

  const handleLeaveSession = async () => {
    if (session && confirm('Are you sure you want to leave this voting session?')) {
      const wasClosed = await onLeaveSession(session.id)
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

        {/* Winner Celebration Screen */}
        {winnerMovie ? (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <div className="text-6xl mb-4 animate-bounce">🏆</div>
            <h3 className="text-2xl font-bold mb-2 text-center">
              {wasRandomWinner ? 'Random Winner!' : 'We Have a Winner!'}
            </h3>
            {winnerMovie.poster && (
              <img
                src={winnerMovie.poster}
                alt={winnerMovie.title}
                className="w-32 h-48 object-cover rounded-lg shadow-lg mb-4"
              />
            )}
            <p className="text-xl font-bold text-purple-400 mb-1 text-center">{winnerMovie.title}</p>
            {winnerMovie.year && (
              <p className="text-gray-400 mb-4">({winnerMovie.year})</p>
            )}
            {wasRandomWinner && (
              <p className="text-sm text-yellow-400 mb-4 text-center">
                It was a tie! Winner selected randomly.
              </p>
            )}
            <div className="flex flex-col gap-2 mt-4 w-full max-w-xs">
              <button
                onClick={handleViewWinnerDetails}
                className="w-full px-6 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white font-medium"
              >
                View Movie Details
              </button>
              <button
                onClick={() => onScheduleMovie?.(winnerMovie)}
                className="w-full px-6 py-2 rounded bg-amber-600 hover:bg-amber-700 text-white font-medium"
              >
                📅 Schedule This Movie
              </button>
              {isCreator && (
                <button
                  onClick={handleFinalizeWinner}
                  className="w-full px-6 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-medium"
                >
                  End Session
                </button>
              )}
              {/* Leave button for non-creator participants */}
              {!isCreator && hasAccepted && (
                <button
                  onClick={handleLeaveSession}
                  className="w-full px-4 py-2 rounded bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 text-sm"
                >
                  Leave Session
                </button>
              )}
            </div>
          </div>
        ) : isLoading ? (
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

            {/* Voting Progress */}
            {hasAccepted && acceptedParticipants.length >= 2 && (
              <div className={`${cardInner} rounded-lg p-3 mb-4 border ${border}`}>
                {votingPhase === 'runoff' && (
                  <div className="text-center mb-2">
                    <span className="text-yellow-400 font-bold text-sm">⚔️ TIEBREAKER ROUND</span>
                    <p className="text-xs text-gray-400">Vote again on the tied movies</p>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-400">Voting Progress</span>
                  <span className={votingProgress.complete ? 'text-green-400' : 'text-gray-400'}>
                    {votingProgress.voted}/{votingProgress.total} votes
                  </span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all ${votingProgress.complete ? 'bg-green-500' : 'bg-purple-500'}`}
                    style={{ width: `${votingProgress.total > 0 ? (votingProgress.voted / votingProgress.total) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {acceptedUserNames.map(userName => {
                    const progress = votingProgress.byUser[userName]
                    const done = progress?.voted === progress?.total
                    return (
                      <span
                        key={userName}
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          done ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-400'
                        }`}
                      >
                        {userName} {done ? '✓' : `${progress?.voted || 0}/${progress?.total || 0}`}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Voting instructions */}
            {hasAccepted && acceptedParticipants.length < 2 && (
              <p className="text-xs text-yellow-400 mb-3 text-center">
                Waiting for at least 2 participants to start voting
              </p>
            )}

            {/* Movie list */}
            {moviesToVote.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-2">🎬</p>
                <p className="opacity-70 mb-1">No movies to vote on yet</p>
                <p className="text-xs text-gray-400">
                  Waiting for participants to pick their movies
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {moviesToVote.map(movie => {
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
                        {movie.selectedBy && (
                          <p className="text-xs text-gray-400 truncate">
                            picked by {movie.selectedBy}
                          </p>
                        )}
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
              {/* Show status or manual declare button */}
              {votingPhase === 'complete' ? (
                <div className="w-full px-4 py-2 rounded bg-green-600/20 text-green-400 text-center">
                  ✓ Winner has been declared!
                </div>
              ) : votingProgress.complete ? (
                <div className="w-full px-4 py-2 rounded bg-purple-600/20 text-purple-400 text-center animate-pulse">
                  🎯 Calculating winner...
                </div>
              ) : (
                <button
                  onClick={handleDeclareWinner}
                  disabled={moviesToVote.length === 0 || (!hasAccepted && !isCreator)}
                  className="w-full px-4 py-2 rounded bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-50"
                >
                  🏆 {votingPhase === 'runoff' ? 'Pick Random Winner' : 'Declare Winner Early'}
                </button>
              )}

              {isCreator && (
                <button
                  onClick={handleCancelSession}
                  className="w-full px-4 py-2 rounded bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm"
                >
                  Cancel Session
                </button>
              )}

              {/* Leave button for non-creator accepted participants */}
              {!isCreator && hasAccepted && (
                <button
                  onClick={handleLeaveSession}
                  className="w-full px-4 py-2 rounded bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 text-sm"
                >
                  Leave Session
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
