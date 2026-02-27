import { useState } from 'react'
import { Avatar } from './AvatarPicker'
import { useToast } from './Toast'
import { searchUsersForFriendRequest } from '../lib/database'

export default function FriendsModal({
  friends = [],
  pendingReceived = [],
  pendingSent = [],
  onSendRequest,
  onAcceptRequest,
  onRejectRequest,
  onCancelRequest,
  onUnfriend,
  onClose,
  darkMode,
  currentUserId
}) {
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState('friends')
  const [processingId, setProcessingId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const border = darkMode ? 'border-gray-700' : 'border-gray-300'
  const textMuted = darkMode ? 'text-gray-400' : 'text-gray-600'

  const tabs = [
    { id: 'friends', label: 'Friends', count: friends.length },
    { id: 'pending', label: 'Requests', count: pendingReceived.length },
    { id: 'sent', label: 'Sent', count: pendingSent.length },
    { id: 'add', label: 'Add Friend', count: null }
  ]

  const handleSearch = async (query) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const results = await searchUsersForFriendRequest(query, currentUserId)
      // Filter out existing friends and pending requests
      const friendIds = friends.map(f => f.friend_id)
      const pendingIds = [...pendingSent.map(r => r.receiver_id), ...pendingReceived.map(r => r.sender_id)]
      const filtered = results.filter(u => !friendIds.includes(u.id) && !pendingIds.includes(u.id))
      setSearchResults(filtered)
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setSearching(false)
    }
  }

  const handleSendRequest = async (userId) => {
    setProcessingId(userId)
    try {
      await onSendRequest(userId)
      addToast('Friend request sent!', 'success')
      setSearchResults(prev => prev.filter(u => u.id !== userId))
    } catch (err) {
      addToast('Failed to send request', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleAccept = async (requestId, senderName) => {
    setProcessingId(requestId)
    try {
      await onAcceptRequest(requestId)
      addToast(`You are now friends with ${senderName}!`, 'success')
    } catch (err) {
      addToast('Failed to accept request', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (requestId) => {
    setProcessingId(requestId)
    try {
      await onRejectRequest(requestId)
      addToast('Request declined', 'info')
    } catch (err) {
      addToast('Failed to decline request', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleCancel = async (requestId) => {
    setProcessingId(requestId)
    try {
      await onCancelRequest(requestId)
      addToast('Request cancelled', 'info')
    } catch (err) {
      addToast('Failed to cancel request', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleUnfriend = async (friendId, friendName) => {
    if (!confirm(`Remove ${friendName} as a friend? You won't see their movies anymore.`)) return

    setProcessingId(friendId)
    try {
      await onUnfriend(friendId)
      addToast(`Removed ${friendName} from friends`, 'info')
    } catch (err) {
      addToast('Failed to remove friend', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffDays < 1) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40 modal-backdrop modal-safe-area">
      <div className={`${card} rounded-lg w-full max-w-lg max-h-[85vh] flex flex-col modal-content`}>
        {/* Header */}
        <div className={`p-4 border-b ${border} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">👥</span>
            <h2 className="text-xl font-bold">Friends</h2>
            {pendingReceived.length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {pendingReceived.length} pending
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${border}`}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-2 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : `${textMuted} hover:text-purple-300`
              }`}
            >
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className={`ml-1 text-xs ${
                  activeTab === tab.id ? 'text-purple-300' : 'opacity-60'
                }`}>
                  ({tab.count})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Friends Tab */}
          {activeTab === 'friends' && (
            <div>
              {friends.length > 0 ? (
                <div className="space-y-2">
                  {friends.map(friendship => {
                    const friend = friendship.friend
                    if (!friend) return null
                    const isProcessing = processingId === friend.id

                    return (
                      <div
                        key={friend.id}
                        className={`${card} border ${border} rounded-lg p-3 flex items-center gap-3`}
                      >
                        <Avatar avatar={friend.avatar} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{friend.name}</p>
                          <p className={`text-xs ${textMuted}`}>
                            Friends since {formatDate(friendship.created_at)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleUnfriend(friend.id, friend.name)}
                          disabled={isProcessing}
                          className={`px-3 py-1.5 rounded text-sm disabled:opacity-50 ${
                            darkMode ? 'bg-gray-700 hover:bg-red-600/50' : 'bg-gray-200 hover:bg-red-200'
                          }`}
                          title="Remove friend"
                        >
                          {isProcessing ? '...' : 'Remove'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="text-4xl mb-3 block">👋</span>
                  <p className={textMuted}>No friends yet</p>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Add friends to see their movies
                  </p>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
                  >
                    Add Friends
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Pending Requests Tab */}
          {activeTab === 'pending' && (
            <div>
              {pendingReceived.length > 0 ? (
                <div className="space-y-2">
                  {pendingReceived.map(request => {
                    const sender = request.sender
                    if (!sender) return null
                    const isProcessing = processingId === request.id

                    return (
                      <div
                        key={request.id}
                        className={`${card} border ${border} rounded-lg p-3`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar avatar={sender.avatar} size="md" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{sender.name}</p>
                            <p className={`text-xs ${textMuted}`}>
                              {formatDate(request.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAccept(request.id, sender.name)}
                            disabled={isProcessing}
                            className="flex-1 px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-white text-sm disabled:opacity-50"
                          >
                            {isProcessing ? '...' : 'Accept'}
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            disabled={isProcessing}
                            className={`flex-1 px-3 py-2 rounded text-sm disabled:opacity-50 ${
                              darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="text-4xl mb-3 block">📭</span>
                  <p className={textMuted}>No pending requests</p>
                </div>
              )}
            </div>
          )}

          {/* Sent Requests Tab */}
          {activeTab === 'sent' && (
            <div>
              {pendingSent.length > 0 ? (
                <div className="space-y-2">
                  {pendingSent.map(request => {
                    const receiver = request.receiver
                    if (!receiver) return null
                    const isProcessing = processingId === request.id

                    return (
                      <div
                        key={request.id}
                        className={`${card} border ${border} rounded-lg p-3 flex items-center gap-3`}
                      >
                        <Avatar avatar={receiver.avatar} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{receiver.name}</p>
                          <p className={`text-xs ${textMuted}`}>
                            Sent {formatDate(request.created_at)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCancel(request.id)}
                          disabled={isProcessing}
                          className={`px-3 py-1.5 rounded text-sm disabled:opacity-50 ${
                            darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                        >
                          {isProcessing ? '...' : 'Cancel'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="text-4xl mb-3 block">📤</span>
                  <p className={textMuted}>No sent requests</p>
                </div>
              )}
            </div>
          )}

          {/* Add Friend Tab */}
          {activeTab === 'add' && (
            <div>
              <div className="mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search by username..."
                  className={`w-full px-4 py-3 rounded-lg border ${border} ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                />
              </div>

              {searching && (
                <div className="text-center py-4">
                  <span className={textMuted}>Searching...</span>
                </div>
              )}

              {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="text-center py-8">
                  <span className="text-4xl mb-3 block">🔍</span>
                  <p className={textMuted}>No users found</p>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Try a different search term
                  </p>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map(user => {
                    const isProcessing = processingId === user.id

                    return (
                      <div
                        key={user.id}
                        className={`${card} border ${border} rounded-lg p-3 flex items-center gap-3`}
                      >
                        <Avatar avatar={user.avatar} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{user.name}</p>
                        </div>
                        <button
                          onClick={() => handleSendRequest(user.id)}
                          disabled={isProcessing}
                          className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-700 text-white text-sm disabled:opacity-50"
                        >
                          {isProcessing ? '...' : 'Add'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {searchQuery.length < 2 && (
                <div className="text-center py-8">
                  <span className="text-4xl mb-3 block">👋</span>
                  <p className={textMuted}>Find friends to add</p>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Search for users by their username
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
