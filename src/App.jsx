import { useState, useEffect } from 'react'
import { useMovies } from './hooks/useMovies'
import { useUsers } from './hooks/useUsers'
import { useVotes } from './hooks/useVotes'
import { filterMovies, sortMovies } from './utils/helpers'
import { useToast } from './components/Toast'

import Header from './components/Header'
import FilterBar from './components/FilterBar'
import MovieGrid from './components/MovieGrid'
import MovieForm from './components/MovieForm'
import MovieDetailsModal from './components/MovieDetailsModal'
import AddUserModal from './components/AddUserModal'
import SpinWheel from './components/SpinWheel'
import VotingModal from './components/VotingModal'
import Recommendations from './components/Recommendations'
import WatchHistory from './components/WatchHistory'
import MovieOfTheWeek from './components/MovieOfTheWeek'
import ShareModal from './components/ShareModal'
import StatsModal from './components/StatsModal'
import Confetti from './components/Confetti'
import WinnerOverlay from './components/WinnerOverlay'
import BottomNav from './components/BottomNav'
import ConfirmDialog from './components/ConfirmDialog'
import TrendingMovies from './components/TrendingMovies'
import Collections from './components/Collections'
import MovieNightScheduler from './components/MovieNightScheduler'
import OfflineIndicator from './components/OfflineIndicator'
import InstallPrompt from './components/InstallPrompt'

export default function App() {
  const { addToast } = useToast()

  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('movienight-darkmode')
    return saved !== null ? JSON.parse(saved) : true
  })

  // Data hooks
  const {
    movies,
    loading: moviesLoading,
    addMovie,
    updateMovie,
    deleteMovie,
    toggleWatched,
    toggleFavorite
  } = useMovies()

  const {
    users,
    currentUser,
    loading: usersLoading,
    selectUser,
    addUser,
    updateUser,
    deleteUser
  } = useUsers()

  const {
    votes,
    castVote
  } = useVotes()

  // UI state
  const [filters, setFilters] = useState({
    view: 'all',
    genre: '',
    mood: '',
    streaming: '',
    watched: 'all',
    favorites: false,
    sortBy: 'created_at'
  })

  // Modal states
  const [showAddMovie, setShowAddMovie] = useState(false)
  const [editingMovie, setEditingMovie] = useState(null)
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [showAddUser, setShowAddUser] = useState(false)
  const [showWheel, setShowWheel] = useState(false)
  const [showVoting, setShowVoting] = useState(false)
  const [showRecs, setShowRecs] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showMOTW, setShowMOTW] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showTrending, setShowTrending] = useState(false)
  const [showCollections, setShowCollections] = useState(false)
  const [showScheduler, setShowScheduler] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, movieId: null, movieTitle: '' })
  const [bulkSelectMode, setBulkSelectMode] = useState(false)
  const [selectedMovies, setSelectedMovies] = useState(new Set())

  // Effects state
  const [showConfetti, setShowConfetti] = useState(false)
  const [winner, setWinner] = useState(null)
  const [currentMOTW, setCurrentMOTW] = useState(null)

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('movienight-darkmode', JSON.stringify(darkMode))
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Keep selectedMovie in sync with movies array
  useEffect(() => {
    if (selectedMovie) {
      const updated = movies.find(m => m.id === selectedMovie.id)
      if (updated) {
        setSelectedMovie(updated)
      } else {
        setSelectedMovie(null)
      }
    }
  }, [movies])

  // Filter and sort movies
  const filteredMovies = sortMovies(
    filterMovies(movies, filters, currentUser),
    filters.sortBy
  )

  // Handlers
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleAddMovie = async (movieData) => {
    try {
      await addMovie({
        ...movieData,
        added_by: currentUser
      })
      setShowAddMovie(false)
      addToast('Movie added successfully!', 'success')
    } catch (err) {
      addToast('Failed to add movie: ' + err.message, 'error')
    }
  }

  const handleEditMovie = async (movieData) => {
    if (!editingMovie) return

    try {
      await updateMovie(editingMovie.id, movieData)
      setEditingMovie(null)
      addToast('Movie updated!', 'success')
    } catch (err) {
      addToast('Failed to update movie: ' + err.message, 'error')
    }
  }

  const handleDeleteMovie = (id) => {
    const movie = movies.find(m => m.id === id)
    setDeleteConfirm({
      isOpen: true,
      movieId: id,
      movieTitle: movie?.title || 'this movie'
    })
  }

  const confirmDeleteMovie = async () => {
    const id = deleteConfirm.movieId
    setDeleteConfirm({ isOpen: false, movieId: null, movieTitle: '' })

    // Handle bulk delete
    if (id === 'bulk') {
      await confirmBulkDelete()
      return
    }

    try {
      await deleteMovie(id)
      addToast('Movie deleted', 'success')
    } catch (err) {
      addToast('Failed to delete movie: ' + err.message, 'error')
    }
  }

  const handleRateMovie = async (id, rating) => {
    try {
      await updateMovie(id, { rating })
      addToast(`Rated ${rating} stars`, 'success')
    } catch (err) {
      addToast('Failed to rate movie', 'error')
    }
  }

  // Bulk action handlers
  const toggleMovieSelection = (id) => {
    setSelectedMovies(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const selectAllMovies = () => {
    setSelectedMovies(new Set(filteredMovies.map(m => m.id)))
  }

  const clearSelection = () => {
    setSelectedMovies(new Set())
    setBulkSelectMode(false)
  }

  const handleBulkMarkWatched = async () => {
    const count = selectedMovies.size
    for (const id of selectedMovies) {
      await toggleWatched(id)
    }
    addToast(`Marked ${count} movies as watched`, 'success')
    clearSelection()
  }

  const handleBulkDelete = async () => {
    const count = selectedMovies.size
    setDeleteConfirm({
      isOpen: true,
      movieId: 'bulk',
      movieTitle: `${count} selected movies`
    })
  }

  const confirmBulkDelete = async () => {
    const count = selectedMovies.size
    setDeleteConfirm({ isOpen: false, movieId: null, movieTitle: '' })

    for (const id of selectedMovies) {
      await deleteMovie(id)
    }
    addToast(`Deleted ${count} movies`, 'success')
    clearSelection()
  }

  const handleMoviePicked = (movie) => {
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 3000)
  }

  const handleMOTWPicked = (movie) => {
    setCurrentMOTW(movie)
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 3000)
  }

  const handleWinnerDeclared = (movie) => {
    setWinner(movie)
    setShowVoting(false)
    setShowConfetti(true)
    setTimeout(() => {
      setShowConfetti(false)
      setWinner(null)
    }, 5000)
  }

  // Loading state
  if (moviesLoading || usersLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🎬</div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  const bg = darkMode ? 'bg-gray-900' : 'bg-gray-100'
  const text = darkMode ? 'text-white' : 'text-gray-900'
  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const border = darkMode ? 'border-gray-700' : 'border-gray-300'

  return (
    <div className={`min-h-screen ${bg} ${text} p-4 pb-20 md:pb-4 transition-colors relative`}>
      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Effects */}
      {showConfetti && <Confetti />}
      {winner && <WinnerOverlay movie={winner} onClose={() => setWinner(null)} />}

      {/* Header */}
      <Header
        users={users}
        currentUser={currentUser}
        onUserChange={selectUser}
        onAddUser={() => setShowAddUser(true)}
        onDeleteUser={deleteUser}
        onUpdateUser={updateUser}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Current Movie of the Week Banner */}
      {currentMOTW && (
        <div className={`${card} border ${border} rounded-lg p-3 mb-4 flex items-center gap-3`}>
          <span className="text-2xl">🎬</span>
          <div className="flex-1">
            <p className="text-xs opacity-70">Movie of the Week</p>
            <p className="font-bold">{currentMOTW.title}</p>
          </div>
          {currentMOTW.poster && (
            <img
              src={currentMOTW.poster}
              alt=""
              className="w-12 h-16 object-cover rounded"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          )}
        </div>
      )}

      {/* Bulk Action Bar */}
      {bulkSelectMode && (
        <div className={`${card} border ${border} rounded-lg p-3 mb-3 flex items-center gap-3 flex-wrap`}>
          <span className="font-medium">{selectedMovies.size} selected</span>
          <button
            onClick={selectAllMovies}
            className="px-3 py-1.5 rounded text-sm bg-gray-600 hover:bg-gray-500 text-white"
          >
            Select All ({filteredMovies.length})
          </button>
          <button
            onClick={handleBulkMarkWatched}
            disabled={selectedMovies.size === 0}
            className="px-3 py-1.5 rounded text-sm bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
          >
            ✓ Mark Watched
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={selectedMovies.size === 0}
            className="px-3 py-1.5 rounded text-sm bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
          >
            🗑️ Delete
          </button>
          <button
            onClick={clearSelection}
            className="px-3 py-1.5 rounded text-sm bg-gray-600 hover:bg-gray-500 text-white ml-auto"
          >
            ✕ Cancel
          </button>
        </div>
      )}

      {/* Action Buttons - Desktop only */}
      <div className="hidden md:flex flex-wrap gap-2 mb-3">
        <button
          onClick={() => handleFilterChange('view', 'all')}
          className={`px-3 py-1.5 rounded text-sm ${
            filters.view === 'all'
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : card
          }`}
        >
          All
        </button>
        <button
          onClick={() => handleFilterChange('view', 'mine')}
          className={`px-3 py-1.5 rounded text-sm ${
            filters.view === 'mine'
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : card
          }`}
        >
          Mine
        </button>
        <button
          onClick={() => setBulkSelectMode(!bulkSelectMode)}
          className={`px-3 py-1.5 rounded text-sm ${
            bulkSelectMode
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : card
          }`}
        >
          ☑️ Select
        </button>
        <button
          onClick={() => setShowAddMovie(true)}
          className="px-3 py-1.5 rounded text-sm bg-purple-600 hover:bg-purple-700 text-white"
        >
          + Add
        </button>
        <button
          onClick={() => setShowWheel(true)}
          className="px-3 py-1.5 rounded text-sm bg-green-600 hover:bg-green-700 text-white"
        >
          🎡
        </button>
        <button
          onClick={() => setShowVoting(true)}
          className="px-3 py-1.5 rounded text-sm bg-blue-600 hover:bg-blue-700 text-white"
        >
          🗳️
        </button>
        <button
          onClick={() => setShowRecs(true)}
          className="px-3 py-1.5 rounded text-sm bg-orange-600 hover:bg-orange-700 text-white"
        >
          💡
        </button>
        <button
          onClick={() => setShowMOTW(true)}
          className="px-3 py-1.5 rounded text-sm bg-yellow-600 hover:bg-yellow-700 text-white"
        >
          📅
        </button>
        <button
          onClick={() => setShowHistory(true)}
          className="px-3 py-1.5 rounded text-sm bg-pink-600 hover:bg-pink-700 text-white"
        >
          📜
        </button>
        <button
          onClick={() => setShowShare(true)}
          className="px-3 py-1.5 rounded text-sm bg-teal-600 hover:bg-teal-700 text-white"
        >
          🔗
        </button>
        <button
          onClick={() => setShowStats(true)}
          className="px-3 py-1.5 rounded text-sm bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          📊
        </button>
        <button
          onClick={() => setShowTrending(true)}
          className="px-3 py-1.5 rounded text-sm bg-red-600 hover:bg-red-700 text-white"
        >
          🔥
        </button>
        <button
          onClick={() => setShowCollections(true)}
          className="px-3 py-1.5 rounded text-sm bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          📚
        </button>
        <button
          onClick={() => setShowScheduler(true)}
          className="px-3 py-1.5 rounded text-sm bg-amber-600 hover:bg-amber-700 text-white"
        >
          📅
        </button>
      </div>

      {/* Mobile Action Row */}
      <div className="md:hidden flex gap-2 mb-3">
        <button
          onClick={() => handleFilterChange('view', 'all')}
          className={`flex-1 py-2 rounded text-sm font-medium ${
            filters.view === 'all'
              ? 'bg-purple-600 text-white'
              : card
          }`}
        >
          All
        </button>
        <button
          onClick={() => handleFilterChange('view', 'mine')}
          className={`flex-1 py-2 rounded text-sm font-medium ${
            filters.view === 'mine'
              ? 'bg-purple-600 text-white'
              : card
          }`}
        >
          Mine
        </button>
        <button
          onClick={() => setBulkSelectMode(!bulkSelectMode)}
          className={`px-3 py-2 rounded text-sm ${bulkSelectMode ? 'bg-purple-600 text-white' : card}`}
        >
          ☑️
        </button>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2 rounded text-sm ${showFilters ? 'bg-purple-600 text-white' : card}`}
        >
          🔽
        </button>
      </div>

      {/* Filter Bar - Collapsible on mobile */}
      <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          darkMode={darkMode}
        />
      </div>

      {/* Movie Grid */}
      <MovieGrid
        movies={filteredMovies}
        users={users}
        onToggleWatched={toggleWatched}
        onToggleFavorite={toggleFavorite}
        onEdit={setEditingMovie}
        onDelete={handleDeleteMovie}
        onMovieClick={setSelectedMovie}
        onRate={handleRateMovie}
        darkMode={darkMode}
        loading={moviesLoading}
        bulkSelectMode={bulkSelectMode}
        selectedMovies={selectedMovies}
        onToggleSelect={toggleMovieSelection}
      />

      {/* Modals */}
      {showAddMovie && (
        <MovieForm
          movie={null}
          onSave={handleAddMovie}
          onClose={() => setShowAddMovie(false)}
          title="Add Movie"
          isEdit={false}
          darkMode={darkMode}
        />
      )}

      {editingMovie && (
        <MovieForm
          movie={editingMovie}
          onSave={handleEditMovie}
          onClose={() => setEditingMovie(null)}
          title="Edit Movie"
          isEdit={true}
          darkMode={darkMode}
        />
      )}

      {selectedMovie && (
        <MovieDetailsModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onEdit={setEditingMovie}
          onToggleWatched={toggleWatched}
          onToggleFavorite={toggleFavorite}
          onAddMovie={handleAddMovie}
          existingMovies={movies}
          currentUser={currentUser}
          darkMode={darkMode}
        />
      )}

      {showAddUser && (
        <AddUserModal
          onAdd={addUser}
          onClose={() => setShowAddUser(false)}
          darkMode={darkMode}
        />
      )}

      {showWheel && (
        <SpinWheel
          movies={filteredMovies}
          onClose={() => setShowWheel(false)}
          onMoviePicked={handleMoviePicked}
          darkMode={darkMode}
        />
      )}

      {showVoting && (
        <VotingModal
          movies={filteredMovies}
          votes={votes}
          users={users}
          currentUser={currentUser}
          onVote={castVote}
          onDeclareWinner={handleWinnerDeclared}
          onClose={() => setShowVoting(false)}
          darkMode={darkMode}
        />
      )}

      {showRecs && (
        <Recommendations
          movies={movies}
          currentUser={currentUser}
          onAddMovie={addMovie}
          onClose={() => setShowRecs(false)}
          darkMode={darkMode}
        />
      )}

      {showHistory && (
        <WatchHistory
          movies={movies}
          onClose={() => setShowHistory(false)}
          darkMode={darkMode}
        />
      )}

      {showMOTW && (
        <MovieOfTheWeek
          movies={movies}
          currentUser={currentUser}
          onPick={handleMOTWPicked}
          onClose={() => setShowMOTW(false)}
          darkMode={darkMode}
        />
      )}

      {showShare && (
        <ShareModal
          movies={movies}
          onClose={() => setShowShare(false)}
          darkMode={darkMode}
        />
      )}

      {showStats && (
        <StatsModal
          movies={movies}
          onClose={() => setShowStats(false)}
          darkMode={darkMode}
        />
      )}

      {showTrending && (
        <TrendingMovies
          existingMovies={movies}
          currentUser={currentUser}
          onAddMovie={handleAddMovie}
          onClose={() => setShowTrending(false)}
          darkMode={darkMode}
        />
      )}

      {showCollections && (
        <Collections
          movies={movies}
          onClose={() => setShowCollections(false)}
          darkMode={darkMode}
        />
      )}

      {showScheduler && (
        <MovieNightScheduler
          movies={movies}
          onClose={() => setShowScheduler(false)}
          darkMode={darkMode}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <BottomNav
        onAddMovie={() => setShowAddMovie(true)}
        onSpinWheel={() => setShowWheel(true)}
        onVote={() => setShowVoting(true)}
        onShowRecs={() => setShowRecs(true)}
        onShowStats={() => setShowStats(true)}
        onShowTrending={() => setShowTrending(true)}
        darkMode={darkMode}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Movie"
        message={`Are you sure you want to delete "${deleteConfirm.movieTitle}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmStyle="danger"
        onConfirm={confirmDeleteMovie}
        onCancel={() => setDeleteConfirm({ isOpen: false, movieId: null, movieTitle: '' })}
        darkMode={darkMode}
      />

      {/* PWA Install Prompt */}
      <InstallPrompt darkMode={darkMode} />
    </div>
  )
}
