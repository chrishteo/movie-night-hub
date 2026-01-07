import { useState } from 'react'
import { Avatar } from './AvatarPicker'
import ParticipantSelector from './ParticipantSelector'
import MoviePickerModal from './MoviePickerModal'

export default function VotingSessionList({
  sessions,
  allSessions = [],
  myInvites,
  users,
  currentUser,
  authUserId,
  isAdmin = false,
  onCreateSession,
  onOpenSession,
  onRespondToInvite,
  onAcceptWithMovies,
  onDeleteSession,
  onClose,
  darkMode
}) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [selectedParticipants, setSelectedParticipants] = useState([])
  const [moviesPerUser, setMoviesPerUser] = useState(5)
  const [creating, setCreating] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)

  // Movie picker state
  const [showMoviePicker, setShowMoviePicker] = useState(false)
  const [pendingSession, setPendingSession] = useState(null) // Session waiting for movie picks
  const [pendingInviteSession, setPendingInviteSession] = useState(null) // Invite waiting for movie picks

  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const cardInner = darkMode ? 'bg-gray-700' : 'bg-gray-100'
  const border = darkMode ? 'border-gray-700' : 'border-gray-300'

  // Filter out admin and current user for participant selection
  const selectableUsers = users.filter(u =>
    u.name.toLowerCase() !== 'admin' && u.auth_id !== authUserId
  )

  const handleCreateSession = async () => {
    if (!sessionName.trim()) return
    setCreating(true)
    try {
      const participantAuthIds = users
        .filter(u => selectedParticipants.includes(u.name))
        .map(u => u.auth_id)
        .filter(Boolean)

      // Create session and get it back
      const session = await onCreateSession(sessionName.trim(), participantAuthIds, moviesPerUser)

      // Show movie picker for creator to select their movies
      if (session) {
        setPendingSession(session)
        setShowMoviePicker(true)
      }

      setSessionName('')
      setSelectedParticipants([])
      setMoviesPerUser(5)
      setShowCreateForm(false)
    } catch (err) {
      console.error('Failed to create session:', err)
    } finally {
      setCreating(false)
    }
  }

  // Handle creator's movie picks after session creation
  const handleCreatorMoviePicks = async (movieIds) => {
    if (pendingSession && onAcceptWithMovies) {
      await onAcceptWithMovies(pendingSession.id, movieIds)
    }
    setShowMoviePicker(false)
    setPendingSession(null)
  }

  // Start the accept flow - show movie picker first
  const handleStartAccept = (invite) => {
    setPendingInviteSession(invite)
    setShowMoviePicker(true)
  }

  // Handle movie picks when accepting an invite
  const handleAcceptWithMovies = async (movieIds) => {
    if (pendingInviteSession && onAcceptWithMovies) {
      await onAcceptWithMovies(pendingInviteSession.session_id, movieIds)
    }
    setShowMoviePicker(false)
    setPendingInviteSession(null)
  }

  // Cancel movie picking
  const handleCancelMoviePicker = () => {
    setShowMoviePicker(false)
    setPendingSession(null)
    setPendingInviteSession(null)
  }

  const toggleParticipant = (userName) => {
    setSelectedParticipants(prev =>
      prev.includes(userName)
        ? prev.filter(u => u !== userName)
        : [...prev, userName]
    )
  }

  // Find sessions I'm part of (accepted)
  const mySessions = sessions.filter(s => {
    // Creator's sessions
    if (s.created_by === authUserId) return true
    // Check if we have any accepted invite for this session
    return myInvites.some(inv =>
      inv.session_id === s.id && inv.status === 'accepted'
    )
  })

  // Pending invites (not yet accepted/declined)
  const pendingInvites = myInvites.filter(inv => inv.status === 'invited')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40 overflow-auto modal-safe-area">
      <div className={`${card} rounded-lg p-4 w-full max-w-lg max-h-[85vh] overflow-auto`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">🗳️ Voting Sessions</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-500/30 rounded-full transition-colors"
          >
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border-2 border-yellow-500/50 animate-pulse">
            <h3 className="text-sm font-bold text-yellow-400 mb-3 flex items-center gap-2">
              <span className="text-lg">📬</span>
              You have {pendingInvites.length} pending invite{pendingInvites.length > 1 ? 's' : ''}!
            </h3>
            <div className="space-y-2">
              {pendingInvites.map(invite => (
                <div
                  key={invite.id}
                  className={`${cardInner} rounded-lg p-3 border-2 border-yellow-500/30`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{invite.session?.name || 'Voting Session'}</p>
                      <p className="text-xs text-gray-400">
                        You've been invited to vote
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStartAccept(invite)}
                        className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white text-sm"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => onRespondToInvite(invite.session_id, false)}
                        className="px-3 py-1 rounded bg-gray-600 hover:bg-gray-500 text-sm"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Sessions */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">
            Active Sessions ({sessions.length})
          </h3>

          {sessions.length === 0 ? (
            <p className="text-center py-6 opacity-50">No active voting sessions</p>
          ) : (
            <div className="space-y-2">
              {sessions.map(session => {
                const isCreator = session.created_by === authUserId
                const isParticipant = mySessions.some(s => s.id === session.id)
                // Look up creator from users array
                const creator = users.find(u => u.auth_id === session.created_by)

                return (
                  <div
                    key={session.id}
                    className={`${cardInner} rounded-lg p-3 border ${border}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {creator && (
                          <Avatar avatar={creator.avatar} size="sm" />
                        )}
                        <div>
                          <p className="font-medium">{session.name}</p>
                          <p className="text-xs text-gray-400">
                            by {creator?.name || 'Unknown'}
                            {isCreator && <span className="text-purple-400 ml-1">(you)</span>}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => onOpenSession(session)}
                        className={`px-3 py-1.5 rounded text-sm ${
                          isParticipant
                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                            : 'bg-gray-600 hover:bg-gray-500'
                        }`}
                      >
                        {isParticipant ? 'Open' : 'View'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Create New Session */}
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-gray-600 hover:border-purple-500 hover:bg-purple-500/10 transition-colors text-gray-400 hover:text-purple-400"
          >
            + Start New Voting Session
          </button>
        ) : (
          <div className={`${cardInner} rounded-lg p-4 border ${border}`}>
            <h3 className="font-medium mb-3">New Voting Session</h3>

            <input
              type="text"
              placeholder="Session name (e.g., Friday Night)"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-600 border-gray-500'
                  : 'bg-white border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3`}
              autoFocus
            />

            {/* Movies Per User */}
            <div className="mb-3">
              <label className="text-sm font-medium mb-2 block">Movies per user:</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={moviesPerUser}
                  onChange={(e) => setMoviesPerUser(Number(e.target.value))}
                  className="flex-1 accent-purple-500"
                />
                <span className={`w-8 text-center font-bold text-lg ${
                  darkMode ? 'text-purple-400' : 'text-purple-600'
                }`}>
                  {moviesPerUser}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Each participant picks {moviesPerUser} movie{moviesPerUser !== 1 ? 's' : ''} for voting
              </p>
            </div>

            {/* Participant Selection */}
            <div className="mb-3">
              <label className="text-sm font-medium mb-2 block">Invite participants:</label>
              <div className="flex flex-wrap gap-2">
                {selectableUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => toggleParticipant(user.name)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                      selectedParticipants.includes(user.name)
                        ? 'bg-purple-600 text-white'
                        : darkMode
                          ? 'bg-gray-600 hover:bg-gray-500'
                          : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    <Avatar avatar={user.avatar} size="xs" />
                    <span>{user.name}</span>
                    {selectedParticipants.includes(user.name) && <span>✓</span>}
                  </button>
                ))}
              </div>
              {selectableUsers.length === 0 && (
                <p className="text-sm text-gray-400">No other users to invite</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setSessionName('')
                  setSelectedParticipants([])
                }}
                className="flex-1 px-3 py-2 rounded bg-gray-600 hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSession}
                disabled={!sessionName.trim() || creating}
                className="flex-1 px-3 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Session'}
              </button>
            </div>
          </div>
        )}

        {/* Admin Panel */}
        {isAdmin && (
          <div className="mt-4">
            <button
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className="w-full px-4 py-2 rounded bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm flex items-center justify-center gap-2"
            >
              <span>🛡️</span>
              <span>Admin: {showAdminPanel ? 'Hide' : 'Show'} All Sessions</span>
              <span>{showAdminPanel ? '▼' : '▶'}</span>
            </button>

            {showAdminPanel && (
              <div className={`mt-3 ${cardInner} rounded-lg p-3 border ${border}`}>
                <h3 className="text-sm font-bold text-red-400 mb-3">
                  All Sessions ({allSessions.length})
                </h3>

                {allSessions.length === 0 ? (
                  <p className="text-center py-4 opacity-50 text-sm">No sessions found</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {allSessions.map(session => {
                      const creator = users.find(u => u.auth_id === session.created_by)
                      const createdAt = new Date(session.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                      const statusColors = {
                        active: 'bg-green-500/20 text-green-400',
                        completed: 'bg-blue-500/20 text-blue-400',
                        cancelled: 'bg-gray-500/20 text-gray-400'
                      }

                      return (
                        <div
                          key={session.id}
                          className={`p-2 rounded border ${border} text-sm`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate">{session.name}</p>
                                <span className={`px-1.5 py-0.5 rounded text-xs ${statusColors[session.status]}`}>
                                  {session.status}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 mt-1">
                                by {creator?.name || 'Unknown'} • {createdAt}
                              </p>
                              {session.ended_at && (
                                <p className="text-xs text-gray-500">
                                  Ended: {new Date(session.ended_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={async () => {
                                if (confirm(`Delete session "${session.name}"? This cannot be undone.`)) {
                                  await onDeleteSession(session.id)
                                }
                              }}
                              className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs shrink-0"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
        >
          Close
        </button>
      </div>

      {/* Movie Picker Modal */}
      {showMoviePicker && (
        <MoviePickerModal
          maxPicks={pendingSession?.movies_per_user || pendingInviteSession?.session?.movies_per_user || 5}
          userName={currentUser}
          onConfirm={pendingSession ? handleCreatorMoviePicks : handleAcceptWithMovies}
          onCancel={handleCancelMoviePicker}
          darkMode={darkMode}
        />
      )}
    </div>
  )
}
