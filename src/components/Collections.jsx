import { useState, useEffect } from 'react'
import { useToast } from './Toast'
import {
  getCollections,
  createCollection,
  deleteCollection,
  getCollectionMovies,
  addMovieToCollection,
  removeMovieFromCollection
} from '../lib/database'

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

export default function Collections({ movies, onClose, darkMode }) {
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

  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const border = darkMode ? 'border-gray-700' : 'border-gray-300'
  const input = darkMode ? 'bg-gray-700' : 'bg-gray-100'

  useEffect(() => {
    fetchCollections()
  }, [])

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

  const handleCreateCollection = async () => {
    if (!newName.trim()) return
    try {
      const collection = await createCollection(newName.trim(), newEmoji, newColor)
      setCollections(prev => [collection, ...prev])
      setNewName('')
      setNewEmoji('📁')
      setNewColor('purple')
      setShowCreate(false)
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

  const collectionMovies = movies.filter(m => collectionMovieIds.includes(m.id))

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
                {collections.map(c => (
                  <div
                    key={c.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                      selectedCollection?.id === c.id
                        ? `${COLLECTION_COLORS[c.color]} text-white`
                        : 'hover:bg-gray-700'
                    }`}
                    onClick={() => setSelectedCollection(c)}
                  >
                    <span>{c.emoji}</span>
                    <span className="flex-1 truncate">{c.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteCollection(c.id)
                      }}
                      className="text-xs opacity-50 hover:opacity-100"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {selectedCollection ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{selectedCollection.emoji}</span>
                  <h3 className="text-lg font-bold">{selectedCollection.name}</h3>
                  <span className="text-sm opacity-50">({collectionMovies.length} movies)</span>
                </div>

                {/* Movies in collection */}
                {collectionMovies.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium mb-2 opacity-70">In Collection:</h4>
                    <div className="flex flex-wrap gap-2">
                      {collectionMovies.map(m => (
                        <div
                          key={m.id}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded ${COLLECTION_COLORS[selectedCollection.color]} text-white text-sm`}
                        >
                          <span className="truncate max-w-[150px]">{m.title}</span>
                          <button
                            onClick={() => handleToggleMovie(m.id)}
                            className="hover:bg-black/20 rounded px-1"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All movies to add */}
                <h4 className="text-sm font-medium mb-2 opacity-70">Add Movies:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {movies.filter(m => !collectionMovieIds.includes(m.id)).map(m => (
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
              </>
            ) : (
              <div className="flex items-center justify-center h-full opacity-50">
                <p>Select a collection to manage movies</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
