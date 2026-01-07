import { useState } from 'react'
import { Avatar } from './AvatarPicker'
import { useToast } from './Toast'

export default function InvitesModal({
  invites = [],
  onAccept,
  onDecline,
  onDelete,
  onClose,
  darkMode,
  users = []
}) {
  const { addToast } = useToast()
  const [processingId, setProcessingId] = useState(null)
  const [ratingInviteId, setRatingInviteId] = useState(null)
  const [rating, setRating] = useState(0)

  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const border = darkMode ? 'border-gray-700' : 'border-gray-300'

  const pendingInvites = invites.filter(inv => inv.status === 'pending')
  const pastInvites = invites.filter(inv => inv.status !== 'pending')

  const handleAccept = async (invite) => {
    setProcessingId(invite.id)
    try {
      await onAccept(invite, rating > 0 ? rating : null)
      addToast(`Marked "${invite.movies?.title}" as watched!`, 'success')
      setRatingInviteId(null)
      setRating(0)
    } catch (err) {
      addToast('Failed to accept invite', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDecline = async (inviteId) => {
    setProcessingId(inviteId)
    try {
      await onDecline(inviteId)
      addToast('Invite declined', 'info')
    } catch (err) {
      addToast('Failed to decline invite', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDelete = async (inviteId) => {
    if (!onDelete) return
    setProcessingId(inviteId)
    try {
      await onDelete(inviteId)
      addToast('Invite removed', 'success')
    } catch (err) {
      addToast('Failed to remove invite', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  // Get inviter info from the joined data or users array
  const getInviterInfo = (invite) => {
    if (invite.inviter) return invite.inviter
    const user = users.find(u => u.auth_id === invite.inviter_id)
    return user || { name: 'Someone', avatar: null }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40 modal-backdrop modal-safe-area">
      <div className={`${card} rounded-lg w-full max-w-lg max-h-[85vh] flex flex-col modal-content`}>
        {/* Header */}
        <div className={`p-4 border-b ${border} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">📩</span>
            <h2 className="text-xl font-bold">Watch Invites</h2>
            {pendingInvites.length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {pendingInvites.length} pending
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Pending Invites */}
          {pendingInvites.length > 0 ? (
            <div className="space-y-3">
              {pendingInvites.map(invite => {
                const inviter = getInviterInfo(invite)
                const isProcessing = processingId === invite.id
                const isRating = ratingInviteId === invite.id

                return (
                  <div
                    key={invite.id}
                    className={`${card} border ${border} rounded-lg p-4`}
                  >
                    <div className="flex gap-3">
                      {/* Movie poster */}
                      {invite.movies?.poster ? (
                        <img
                          src={invite.movies.poster}
                          alt=""
                          className="w-16 h-24 object-cover rounded flex-shrink-0"
                        />
                      ) : (
                        <div className={`w-16 h-24 rounded flex items-center justify-center text-2xl flex-shrink-0 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          🎬
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold truncate">{invite.movies?.title || 'Unknown Movie'}</h4>
                        {invite.movies?.year && (
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {invite.movies.year}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <Avatar avatar={inviter.avatar} size="xs" />
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                            Invited by <span className="text-purple-400 font-medium">{inviter.name}</span>
                          </span>
                        </div>

                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {formatDate(invite.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Rating selector (shown when accepting) */}
                    {isRating && (
                      <div className={`mt-3 p-3 rounded ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                        <p className="text-sm mb-2">Rate this movie (optional):</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              onClick={() => setRating(rating === star ? 0 : star)}
                              className={`text-2xl transition-transform hover:scale-110 ${
                                star <= rating ? 'text-yellow-400' : 'text-gray-500'
                              }`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-3">
                      {!isRating ? (
                        <>
                          <button
                            onClick={() => setRatingInviteId(invite.id)}
                            disabled={isProcessing}
                            className="flex-1 px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-white text-sm disabled:opacity-50"
                          >
                            ✓ Accept
                          </button>
                          <button
                            onClick={() => handleDecline(invite.id)}
                            disabled={isProcessing}
                            className={`flex-1 px-3 py-2 rounded text-sm disabled:opacity-50 ${
                              darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                          >
                            ✕ Decline
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { setRatingInviteId(null); setRating(0) }}
                            disabled={isProcessing}
                            className={`flex-1 px-3 py-2 rounded text-sm disabled:opacity-50 ${
                              darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleAccept(invite)}
                            disabled={isProcessing}
                            className="flex-1 px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-white text-sm disabled:opacity-50"
                          >
                            {isProcessing ? 'Saving...' : `Confirm${rating > 0 ? ` (${rating}★)` : ''}`}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <span className="text-4xl mb-3 block">📭</span>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>No pending invites</p>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                When someone logs a movie night with you, you'll see it here
              </p>
            </div>
          )}

          {/* Past Invites (collapsed by default) */}
          {pastInvites.length > 0 && (
            <details className="mt-6">
              <summary className={`cursor-pointer text-sm hover:underline ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Past invites ({pastInvites.length})
              </summary>
              <div className="mt-3 space-y-2">
                {pastInvites.slice(0, 10).map(invite => {
                  const inviter = getInviterInfo(invite)
                  const isProcessing = processingId === invite.id
                  return (
                    <div
                      key={invite.id}
                      className={`${card} border ${border} rounded p-3 flex items-center gap-3 opacity-60`}
                    >
                      <span className={invite.status === 'accepted' ? 'text-green-400' : 'text-gray-400'}>
                        {invite.status === 'accepted' ? '✓' : '✕'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{invite.movies?.title || 'Unknown'}</p>
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          From {inviter.name} • {formatDate(invite.responded_at || invite.created_at)}
                        </p>
                      </div>
                      {onDelete && (
                        <button
                          onClick={() => handleDelete(invite.id)}
                          disabled={isProcessing}
                          className="p-1.5 rounded hover:bg-red-600/30 text-red-400 text-sm disabled:opacity-50"
                          title="Remove from history"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}
