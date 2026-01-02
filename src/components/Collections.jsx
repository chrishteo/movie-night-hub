import { useState, useEffect, useCallback } from 'react'
import { useToast } from './Toast'
import {
  getCollections,
  createCollection,
  deleteCollection,
  getCollectionMovies,
  addMovieToCollection,
  removeMovieFromCollection,
  getCollectionShares,
  shareCollection,
  updateCollectionShare,
  removeCollectionShare
} from '../lib/database'
import { Avatar } from './AvatarPicker'

const COLLECTION_COLORS = {
  purple: 'bg-purple-600',
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  red: 'bg-red-600',
  orange: 'bg-orange-600',
  pink: 'bg-pink-600',
  yellow: 'bg-yellow-600',
  teal: 'bg-teal-600'
}

const COLLECTION_EMOJIS = ['📁', '🎬', '🍿', '🎃', '❤️', '🌙', '☀️', '🎄', '🎉', '👻', '🦸', '🔥', '💫', '🌟']

export default function Collections({ movies, onClose, darkMode, authUserId = null, users = [] }) {
  const { addToast } = useToast()
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCollection, setSelectedCollection] = useState(null)
  const [collectionMovieIds, setCollectionMovieIds] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('📁')
  const [newColor, setNewColor] = useState('purple')

  // Sharing state
  const [showShareModal, setShowShareModal] = useState(false)
  const [shares, setShares] = useState([])
  const [loadingShares, setLoadingShares] = useState(false)

  // Search state for adding movies
  const [movieSearch, setMovieSearch] = useState('')

  // Edit mode state
  const [editMode, setEditMode] = useState(false)

  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const border = darkMode ? 'border-gray-700' : 'border-gray-300'
  const input = darkMode ? 'bg-gray-700' : 'bg-gray-100'

  // Get current user's profile
  const currentUserProfile = users.find(u => u.auth_id === authUserId)

  useEffect(() => {
    fetchCollections()
  }, [])

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showShareModal) {
          setShowShareModal(false)
        } else {
          onClose()
        }
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose, showShareModal])

  useEffect(() => {
    if (selectedCollection) {
      fetchCollectionMovies(selectedCollection.id)
    }
  }, [selectedCollection])

  const fetchCollections = async () => {
    try {
      setError(null)
      const data = await getCollections()
      setCollections(data || [])
    } catch (err) {
      console.error('Error fetching collections:', err)
      setError('Failed to load collections')
      addToast('Failed to load collections', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchCollectionMovies = async (collectionId) => {
    try {
      const movieIds = await getCollectionMovies(collectionId)
      setCollectionMovieIds(movieIds)
    } catch (err) {
      console.error('Error fetching collection movies:', err)
      addToast('Failed to load collection movies', 'error')
    }
  }

  const fetchShares = async (collectionId) => {
    setLoadingShares(true)
    try {
      const data = await getCollectionShares(collectionId)
      setShares(data || [])
    } catch (err) {
      console.error('Error fetching shares:', err)
      setShares([])
    } finally {
      setLoadingShares(false)
    }
  }

  const handleCreateCollection = async () => {
    if (!newName.trim()) return
    try {
      const collection = await createCollection(newName.trim(), newEmoji, newColor, authUserId)
      setCollections(prev => [collection, ...prev])
      setNewName('')
      setNewEmoji('📁')
      setNewColor('purple')
      setShowCreate(false)
      addToast('Collection created!', 'success')
    } catch (err) {
      console.error('Error creating collection:', err)
      addToast('Failed to create collection', 'error')
    }
  }

  const handleDeleteCollection = async (id) => {
    if (!confirm('Delete this collection?')) return
    try {
      await deleteCollection(id)
      setCollections(prev => prev.filter(c => c.id !== id))
      if (selectedCollection?.id === id) {
        setSelectedCollection(null)
      }
      addToast('Collection deleted', 'success')
    } catch (err) {
      console.error('Error deleting collection:', err)
      addToast('Failed to delete collection', 'error')
    }
  }

  const handleToggleMovie = async (movieId) => {
    if (!selectedCollection) return
    try {
      if (collectionMovieIds.includes(movieId)) {
        await removeMovieFromCollection(selectedCollection.id, movieId)
        setCollectionMovieIds(prev => prev.filter(id => id !== movieId))
      } else {
        await addMovieToCollection(selectedCollection.id, movieId)
        setCollectionMovieIds(prev => [...prev, movieId])
      }
    } catch (err) {
      console.error('Error toggling movie:', err)
      addToast('Failed to update collection', 'error')
    }
  }

  // Sharing handlers
  const handleOpenShareModal = async (collection) => {
    setSelectedCollection(collection)
    setShowShareModal(true)
    await fetchShares(collection.id)
  }

  const handleShareWithUser = async (userId, canEdit = false) => {
    if (!selectedCollection) return
    try {
      const share = await shareCollection(selectedCollection.id, userId, canEdit, authUserId)
      // Fetch full share data with user info
      await fetchShares(selectedCollection.id)
      addToast('Collection shared!', 'success')
    } catch (err) {
      console.error('Error sharing collection:', err)
      if (err.message?.includes('duplicate')) {
        addToast('Already shared with this user', 'error')
      } else {
        addToast('Failed to share collection', 'error')
      }
    }
  }

  const handleUpdateShare = async (shareId, canEdit) => {
    try {
      await updateCollectionShare(shareId, canEdit)
      setShares(prev => prev.map(s => s.id === shareId ? { ...s, can_edit: canEdit } : s))
      addToast('Share updated', 'success')
    } catch (err) {
      console.error('Error updating share:', err)
      addToast('Failed to update share', 'error')
    }
  }

  const handleRemoveShare = async (shareId) => {
    try {
      await removeCollectionShare(shareId)
      setShares(prev => prev.filter(s => s.id !== shareId))
      addToast('Share removed', 'success')
    } catch (err) {
      console.error('Error removing share:', err)
      addToast('Failed to remove share', 'error')
    }
  }

  // Check if current user owns a collection
  const isOwner = (collection) => collection.user_id === authUserId

  // Check if current user can edit (owner or has edit permission)
  const canEdit = (collection) => {
    if (isOwner(collection)) return true
    // Check if shared with edit permission - would need to track this in state
    // For now, we'll check when loading collection movies
    return true // Simplified - RLS will handle actual permission
  }

  // Get owner info for shared collections
  const getOwnerInfo = (collection) => {
    if (isOwner(collection)) return null
    return users.find(u => u.auth_id === collection.user_id)
  }

  const collectionMovies = movies.filter(m => collectionMovieIds.includes(m.id))

  // Users available to share with (exclude owner and already shared)
  const availableUsers = users.filter(u => {
    if (!selectedCollection) return false
    if (u.auth_id === authUserId) return false // Can't share with yourself
    if (shares.some(s => s.shared_with_user_id === u.id)) return false // Already shared
    return true
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40 modal-backdrop">
      <div className={`${card} rounded-lg w-full max-w-4xl max-h-[85vh] flex flex-col modal-content`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📚</span>
            <h2 className="text-xl font-bold">Collections</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Collection list */}
          <div className={`w-64 border-r ${border} p-4 overflow-y-auto`}>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="w-full px-3 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white mb-4"
            >
              + New Collection
            </button>

            {showCreate && (
              <div className={`${card} border ${border} rounded p-3 mb-4`}>
                <input
                  type="text"
                  placeholder="Collection name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={`w-full px-2 py-1 rounded ${input} border ${border} mb-2 text-sm`}
                  autoFocus
                />
                <div className="flex flex-wrap gap-1 mb-2">
                  {COLLECTION_EMOJIS.map(e => (
                    <button
                      key={e}
                      onClick={() => setNewEmoji(e)}
                      className={`w-7 h-7 rounded ${newEmoji === e ? 'ring-2 ring-purple-500' : ''}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {Object.keys(COLLECTION_COLORS).map(c => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      className={`w-6 h-6 rounded ${COLLECTION_COLORS[c]} ${newColor === c ? 'ring-2 ring-white' : ''}`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreate(false)}
                    className="flex-1 px-2 py-1 rounded bg-gray-600 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateCollection}
                    disabled={!newName.trim()}
                    className="flex-1 px-2 py-1 rounded bg-purple-600 text-sm disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-4">
                <span className="animate-spin text-2xl">🎬</span>
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <p className="text-sm text-red-400 mb-2">{error}</p>
                <button
                  onClick={fetchCollections}
                  className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white text-sm"
                >
                  Retry
                </button>
              </div>
            ) : collections.length === 0 ? (
              <p className="text-sm opacity-50 text-center">No collections yet</p>
            ) : (
              <div className="space-y-2">
                {collections.map(c => {
                  const owner = getOwnerInfo(c)
                  return (
                    <div
                      key={c.id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                        selectedCollection?.id === c.id
                          ? `${COLLECTION_COLORS[c.color]} text-white`
                          : 'hover:bg-gray-700'
                      }`}
                      onClick={() => { setSelectedCollection(c); setMovieSearch(''); setEditMode(false) }}
                    >
                      <span>{c.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <span className="truncate block">{c.name}</span>
                        {owner && (
                          <span className="text-xs opacity-70 truncate block">
                            by {owner.name}
                          </span>
                        )}
                      </div>
                      {!isOwner(c) && (
                        <span className="text-xs opacity-70" title="Shared with you">👥</span>
                      )}
                      {isOwner(c) && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenShareModal(c)
                            }}
                            className="text-xs opacity-50 hover:opacity-100 p-1"
                            title="Share"
                          >
                            🔗
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteCollection(c.id)
                            }}
                            className="text-xs opacity-50 hover:opacity-100"
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {selectedCollection ? (
              <>
                {/* Header with title and actions */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{selectedCollection.emoji}</span>
                    <h3 className="text-lg font-bold">{selectedCollection.name}</h3>
                    <span className="text-sm opacity-50">({collectionMovies.length} movies)</span>
                    {!isOwner(selectedCollection) && (
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-600/30 text-blue-300">
                        Shared by {getOwnerInfo(selectedCollection)?.name || 'Unknown'}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className={`px-3 py-1.5 rounded text-sm transition-colors ${
                      editMode
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    {editMode ? '✓ Done' : '✏️ Edit'}
                  </button>
                </div>

                {editMode ? (
                  /* Edit Mode - Add/Remove movies */
                  <>
                    {/* Current movies in collection (removable) */}
                    {collectionMovies.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium mb-2 opacity-70">In Collection (click to remove):</h4>
                        <div className="flex flex-wrap gap-2">
                          {collectionMovies.map(m => (
                            <button
                              key={m.id}
                              onClick={() => handleToggleMovie(m.id)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded ${COLLECTION_COLORS[selectedCollection.color]} text-white text-sm hover:opacity-80 transition-opacity`}
                            >
                              <span className="truncate max-w-[150px]">{m.title}</span>
                              <span className="opacity-70">✕</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Search and add movies */}
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="text-sm font-medium opacity-70">Add Movies:</h4>
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder="Search by title, director, genre, year..."
                          value={movieSearch}
                          onChange={(e) => setMovieSearch(e.target.value)}
                          className={`w-full px-3 py-1.5 rounded ${input} text-sm focus:outline-none focus:ring-2 focus:ring-purple-500`}
                        />
                        {movieSearch && (
                          <button
                            onClick={() => setMovieSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                    {(() => {
                      const availableMovies = movies
                        .filter(m => !collectionMovieIds.includes(m.id))
                        .filter(m => {
                          if (!movieSearch.trim()) return true
                          const search = movieSearch.toLowerCase()
                          return (
                            m.title?.toLowerCase().includes(search) ||
                            m.director?.toLowerCase().includes(search) ||
                            m.genre?.toLowerCase().includes(search) ||
                            m.year?.toString().includes(search)
                          )
                        })

                      if (availableMovies.length === 0) {
                        return (
                          <div className="text-center py-8 opacity-50">
                            {movieSearch ? (
                              <p>No movies found for "{movieSearch}"</p>
                            ) : (
                              <p>All movies are already in this collection</p>
                            )}
                          </div>
                        )
                      }

                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {availableMovies.map(m => (
                            <button
                              key={m.id}
                              onClick={() => handleToggleMovie(m.id)}
                              className={`${card} border ${border} p-2 rounded text-left hover:border-purple-500 transition-colors`}
                            >
                              <div className="flex gap-2">
                                {m.poster ? (
                                  <img src={m.poster} alt="" className="w-10 h-14 object-cover rounded" />
                                ) : (
                                  <div className="w-10 h-14 bg-gray-700 rounded flex items-center justify-center">🎬</div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{m.title}</p>
                                  <p className="text-xs opacity-50">{m.year}</p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )
                    })()}
                  </>
                ) : (
                  /* View Mode - Display movies nicely */
                  <>
                    {collectionMovies.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {collectionMovies.map(m => (
                          <div
                            key={m.id}
                            className={`${card} border ${border} rounded-lg overflow-hidden hover:border-purple-500 transition-colors`}
                          >
                            {m.poster ? (
                              <img
                                src={m.poster}
                                alt={m.title}
                                className="w-full h-48 object-cover"
                              />
                            ) : (
                              <div className="w-full h-48 bg-gray-700 flex items-center justify-center text-4xl">
                                🎬
                              </div>
                            )}
                            <div className="p-3">
                              <h4 className="font-medium truncate" title={m.title}>{m.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                {m.year && <span className="text-xs opacity-50">{m.year}</span>}
                                {m.genre && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-purple-600/30 text-purple-300">
                                    {m.genre}
                                  </span>
                                )}
                              </div>
                              {m.rating > 0 && (
                                <div className="flex gap-0.5 mt-2">
                                  {[1, 2, 3, 4, 5].map(s => (
                                    <span key={s} className={`text-sm ${s <= m.rating ? 'text-yellow-400' : 'text-gray-600'}`}>★</span>
                                  ))}
                                </div>
                              )}
                              {m.watched && (
                                <span className="inline-block mt-2 text-xs px-1.5 py-0.5 rounded bg-green-600/30 text-green-300">
                                  ✓ Watched
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 opacity-50">
                        <span className="text-4xl mb-2">📭</span>
                        <p>This collection is empty</p>
                        <button
                          onClick={() => setEditMode(true)}
                          className="mt-3 px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white text-sm"
                        >
                          + Add Movies
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full opacity-50">
                <p>Select a collection to manage movies</p>
              </div>
            )}
          </div>
        </div>

        {/* Share Modal */}
        {showShareModal && selectedCollection && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className={`${card} rounded-lg w-full max-w-md p-4`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2">
                  <span>🔗</span>
                  Share "{selectedCollection.name}"
                </h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Current shares */}
              {loadingShares ? (
                <div className="text-center py-4">
                  <span className="animate-spin">⏳</span>
                </div>
              ) : shares.length > 0 ? (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2 opacity-70">Shared with:</h4>
                  <div className="space-y-2">
                    {shares.map(share => (
                      <div key={share.id} className={`flex items-center gap-3 p-2 rounded ${input}`}>
                        <Avatar avatar={share.users?.avatar} size="sm" />
                        <span className="flex-1">{share.users?.name || 'Unknown'}</span>
                        <label className="flex items-center gap-1 text-sm">
                          <input
                            type="checkbox"
                            checked={share.can_edit}
                            onChange={(e) => handleUpdateShare(share.id, e.target.checked)}
                            className="rounded"
                          />
                          Can edit
                        </label>
                        <button
                          onClick={() => handleRemoveShare(share.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm opacity-50 mb-4">Not shared with anyone yet</p>
              )}

              {/* Add new share */}
              {availableUsers.length > 0 ? (
                <div>
                  <h4 className="text-sm font-medium mb-2 opacity-70">Share with:</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableUsers.map(user => (
                      <div key={user.id} className={`flex items-center gap-3 p-2 rounded ${input}`}>
                        <Avatar avatar={user.avatar} size="sm" />
                        <span className="flex-1">{user.name}</span>
                        <button
                          onClick={() => handleShareWithUser(user.id, false)}
                          className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs"
                        >
                          View only
                        </button>
                        <button
                          onClick={() => handleShareWithUser(user.id, true)}
                          className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white text-xs"
                        >
                          Can edit
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm opacity-50">No other users to share with</p>
              )}

              <button
                onClick={() => setShowShareModal(false)}
                className="w-full mt-4 px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
