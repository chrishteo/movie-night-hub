import { useState, useEffect } from 'react'
import { useMovies } from './hooks/useMovies'
import { useUsers } from './hooks/useUsers'
import { useVotes } from './hooks/useVotes'
import { useAuth } from './hooks/useAuth.jsx'
import { useAdmin } from './hooks/useAdmin'
import { useTutorial } from './hooks/useTutorial'
import { filterMovies, sortMovies } from './utils/helpers'
import { useToast } from './components/Toast'

import Auth from './components/Auth'
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
import AdminPanel from './components/AdminPanel'
import BugReportModal from './components/BugReportModal'
import MyBugReports from './components/MyBugReports'
import AnnouncementBanner from './components/AnnouncementBanner'
import GuidedTour from './components/GuidedTour'

export default function App() {
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const { addToast } = useToast()
  const { user, loading: authLoading, signOut, isAuthenticated } = useAuth()

  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('movienight-darkmode')
    return saved !== null ? JSON.parse(saved) : true
  })

  // Data hooks - must be called unconditionally
  // Pass auth user ID for RLS security
  const authUserId = user?.id || null

  const {
    movies,
    loading: moviesLoading,
    loadingMore,
    hasMore,
    total,
    addMovie,
    updateMovie,
    deleteMovie,
    toggleWatched,
    toggleFavorite,
    loadMore,
    canModifyMovie
  } = useMovies(authUserId)

  const {
    users,
    currentUser,
    loading: usersLoading,
    selectUser,
    addUser,
    updateUser,
    deleteUser
  } = useUsers(user)

  const {
    votes,
    castVote,
    removeVote
  } = useVotes(authUserId)

  const {
    isAdmin,
    announcements,
    bugReports,
    fetchAnnouncements,
    addAnnouncement,
    editAnnouncement,
    removeAnnouncement,
    fetchBugReports,
    submitBugReport,
    editBugReport,
    removeBugReport,
    toggleUserAdmin,
    removeUser,
    removeMovie
  } = useAdmin(authUserId)

  // Tutorial state
  const {
    showTour,
    completeTutorial,
    skipTour,
    startTour
  } = useTutorial()

  // UI state
  const [filters, setFilters] = useState({
    view: 'mine',
    genre: '',
    mood: '',
    streaming: '',
    watched: 'all',
    favorites: false,
    sortBy: 'created_at'
  })

  // View mode: 'grid' or 'list'
  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem('movienight-viewmode')
    return saved || 'grid'
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
  const [duplicateConfirm, setDuplicateConfirm] = useState({ isOpen: false, movieData: null, existingMovie: null })
  const [bulkSelectMode, setBulkSelectMode] = useState(false)
  const [selectedMovies, setSelectedMovies] = useState(new Set())
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showBugReport, setShowBugReport] = useState(false)
  const [showMyBugReports, setShowMyBugReports] = useState(false)

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

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem('movienight-viewmode', viewMode)
  }, [viewMode])

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

  // Show loading screen while checking auth
  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Loading...</p>
        </div>
      </div>
    )
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Auth darkMode={darkMode} />
  }

  // Filter and sort movies
  const filteredMovies = sortMovies(
    filterMovies(movies, filters, currentUser),
    filters.sortBy
  )

  // Get recently watched movies (last 3) - only movies added by current user
  const recentlyWatched = movies
    .filter(m => m.watched && m.watched_at && m.added_by === currentUser)
    .sort((a, b) => new Date(b.watched_at) - new Date(a.watched_at))
    .slice(0, 3)

  // Handlers
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleAddMovie = async (movieData, skipDuplicateCheck = false) => {
    // Check for duplicates unless we're confirming an intentional duplicate
    if (!skipDuplicateCheck && movieData.title) {
      const normalizedTitle = movieData.title.toLowerCase().trim()
      const existingMovie = movies.find(m =>
        m.title.toLowerCase().trim() === normalizedTitle
      )

      if (existingMovie) {
        setDuplicateConfirm({
          isOpen: true,
          movieData,
          existingMovie
        })
        return
      }
    }

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

  const confirmAddDuplicate = async () => {
    const { movieData } = duplicateConfirm
    setDuplicateConfirm({ isOpen: false, movieData: null, existingMovie: null })

    if (movieData) {
      await handleAddMovie(movieData, true) // Skip duplicate check
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

  // Wrapper for canModifyMovie that includes currentUser name for legacy movies
  const canModify = (movie) => canModifyMovie(movie, currentUser)

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

  // Only select movies the user can modify
  const selectAllMovies = () => {
    const ownedMovies = filteredMovies.filter(m => canModify(m))
    setSelectedMovies(new Set(ownedMovies.map(m => m.id)))
  }

  const clearSelection = () => {
    setSelectedMovies(new Set())
    setBulkSelectMode(false)
  }

  const handleBulkMarkWatched = async () => {
    const count = selectedMovies.size
    let failed = 0
    for (const id of selectedMovies) {
      try {
        await toggleWatched(id)
      } catch (err) {
        console.error('Error marking movie watched:', err)
        failed++
      }
    }
    if (failed > 0) {
      addToast(`Marked ${count - failed} movies, ${failed} failed`, 'error')
    } else {
      addToast(`Marked ${count} movies as watched`, 'success')
    }
    clearSelection()
  }

  const handleBulkDelete = async () => {
    // Filter to only movies the user can delete
    const deletableMovies = [...selectedMovies].filter(id => {
      const movie = movies.find(m => m.id === id)
      return movie && canModify(movie)
    })

    if (deletableMovies.length === 0) {
      addToast('You can only delete movies you added', 'error')
      return
    }

    setDeleteConfirm({
      isOpen: true,
      movieId: 'bulk',
      movieTitle: `${deletableMovies.length} of your movies`
    })
  }

  const confirmBulkDelete = async () => {
    setDeleteConfirm({ isOpen: false, movieId: null, movieTitle: '' })

    // Only delete movies the user owns
    const deletableIds = [...selectedMovies].filter(id => {
      const movie = movies.find(m => m.id === id)
      return movie && canModify(movie)
    })

    let failed = 0
    for (const id of deletableIds) {
      try {
        await deleteMovie(id)
      } catch (err) {
        console.error('Error deleting movie:', err)
        failed++
      }
    }
    if (failed > 0) {
      addToast(`Deleted ${deletableIds.length - failed} movies, ${failed} failed`, 'error')
    } else {
      addToast(`Deleted ${deletableIds.length} movies`, 'success')
    }
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

      {/* Announcements Banner */}
      <AnnouncementBanner announcements={announcements} />

      {/* Effects */}
      {showConfetti && <Confetti />}
      {winner && <WinnerOverlay movie={winner} onClose={() => setWinner(null)} />}

      {/* Header */}
      <Header
        users={users}
        currentUser={currentUser}
        onUserChange={selectUser}
        onUpdateUser={updateUser}
        onSignOut={signOut}
        authEmail={user?.email}
        authUserId={authUserId}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        isAdmin={isAdmin}
        onOpenAdmin={() => setShowAdminPanel(true)}
        onOpenBugReport={() => setShowBugReport(true)}
        onOpenMyBugReports={() => setShowMyBugReports(true)}
        onStartTutorial={startTour}
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
      {bulkSelectMode && (() => {
        const ownedCount = filteredMovies.filter(m => canModify(m)).length
        const selectedDeletable = [...selectedMovies].filter(id => {
          const movie = movies.find(m => m.id === id)
          return movie && canModify(movie)
        }).length

        return (
          <div className={`${card} border ${border} rounded-lg p-3 mb-3 flex items-center gap-3 flex-wrap`}>
            <span className="font-medium">{selectedMovies.size} selected</span>
            <button
              onClick={selectAllMovies}
              className="px-3 py-1.5 rounded text-sm bg-gray-600 hover:bg-gray-500 text-white"
              title="Select all movies you can modify"
            >
              Select Mine ({ownedCount})
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
              disabled={selectedDeletable === 0}
              className="px-3 py-1.5 rounded text-sm bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              title={selectedDeletable < selectedMovies.size ? `Can only delete ${selectedDeletable} of ${selectedMovies.size} (your movies)` : ''}
            >
              🗑️ Delete {selectedDeletable > 0 && selectedDeletable < selectedMovies.size ? `(${selectedDeletable})` : ''}
            </button>
            <button
              onClick={clearSelection}
              className="px-3 py-1.5 rounded text-sm bg-gray-600 hover:bg-gray-500 text-white ml-auto"
            >
              ✕ Cancel
            </button>
          </div>
        )
      })()}

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
          data-tour="add-movie"
        >
          + Add
        </button>
        <button
          onClick={() => setShowWheel(true)}
          className="px-3 py-1.5 rounded text-sm bg-green-600 hover:bg-green-700 text-white"
          data-tour="spin-wheel"
        >
          🎡
        </button>
        <button
          onClick={() => setShowVoting(true)}
          className="px-3 py-1.5 rounded text-sm bg-blue-600 hover:bg-blue-700 text-white"
          data-tour="voting"
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
          data-tour="filters-mobile"
        >
          🔽
        </button>
      </div>

      {/* Filter Bar - Collapsible on mobile */}
      <div className={`${showFilters ? 'block' : 'hidden'} md:block`} data-tour="filters">
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          darkMode={darkMode}
          users={users}
        />
      </div>

      {/* Recently Watched Section */}
      {recentlyWatched.length > 0 && (
        <div className={`${card} border ${border} rounded-lg p-4 mb-4`}>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <span>📺</span> Recently Watched
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recentlyWatched.map(movie => (
              <button
                key={movie.id}
                onClick={() => setSelectedMovie(movie)}
                className="flex-shrink-0 group"
              >
                {movie.poster ? (
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-16 h-24 object-cover rounded shadow-lg group-hover:ring-2 ring-purple-500 transition-all"
                  />
                ) : (
                  <div className={`w-16 h-24 rounded flex items-center justify-center text-2xl ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    🎬
                  </div>
                )}
                <p className="text-xs mt-1 truncate w-16 opacity-70">{movie.title}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="flex justify-end mb-3">
        <div className={`inline-flex rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} p-1`}>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              viewMode === 'grid'
                ? 'bg-purple-600 text-white'
                : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ▦ Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-purple-600 text-white'
                : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ☰ List
          </button>
        </div>
      </div>

      {/* Movie Grid/List */}
      <div data-tour="movie-card">
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
        viewMode={viewMode}
        canModifyMovie={canModify}
      />
      </div>

      {/* Load More Button */}
      {hasMore && !moviesLoading && (
        <div className="flex justify-center py-8">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            } ${loadingMore ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loadingMore ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading...
              </span>
            ) : (
              `Load More (${movies.length} of ${total})`
            )}
          </button>
        </div>
      )}

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
          movies={movies}
          users={users}
          onClose={() => setShowWheel(false)}
          onMoviePicked={handleMoviePicked}
          darkMode={darkMode}
        />
      )}

      {showVoting && (
        <VotingModal
          movies={movies}
          votes={votes}
          users={users}
          currentUser={currentUser}
          onVote={castVote}
          onRemoveVote={removeVote}
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
          users={users}
          onClose={() => setShowCollections(false)}
          darkMode={darkMode}
          authUserId={authUserId}
        />
      )}

      {showScheduler && (
        <MovieNightScheduler
          movies={movies}
          onClose={() => setShowScheduler(false)}
          darkMode={darkMode}
          authUserId={authUserId}
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

      {/* Duplicate Movie Confirm Dialog */}
      <ConfirmDialog
        isOpen={duplicateConfirm.isOpen}
        title="Duplicate Movie"
        message={`"${duplicateConfirm.existingMovie?.title}" is already in your list${duplicateConfirm.existingMovie?.added_by ? ` (added by ${duplicateConfirm.existingMovie.added_by})` : ''}. Add it anyway?`}
        confirmText="Add Anyway"
        cancelText="Cancel"
        confirmStyle="warning"
        onConfirm={confirmAddDuplicate}
        onCancel={() => setDuplicateConfirm({ isOpen: false, movieData: null, existingMovie: null })}
        darkMode={darkMode}
      />

      {/* Admin Panel */}
      {showAdminPanel && isAdmin && (
        <AdminPanel
          onClose={() => setShowAdminPanel(false)}
          darkMode={darkMode}
          users={users}
          movies={movies}
          currentUserId={users.find(u => u.name === currentUser)?.id}
          onToggleUserAdmin={async (userId, makeAdmin) => {
            try {
              await toggleUserAdmin(userId, makeAdmin)
              addToast(makeAdmin ? 'User is now an admin' : 'Admin access removed', 'success')
            } catch (err) {
              addToast('Failed to update admin status', 'error')
            }
          }}
          onDeleteUser={async (userId) => {
            try {
              await removeUser(userId)
              addToast('User deleted', 'success')
            } catch (err) {
              addToast('Failed to delete user', 'error')
            }
          }}
          onDeleteMovie={async (movieId) => {
            try {
              await removeMovie(movieId)
              addToast('Movie deleted', 'success')
            } catch (err) {
              addToast('Failed to delete movie', 'error')
            }
          }}
          announcements={announcements}
          onFetchAnnouncements={fetchAnnouncements}
          onAddAnnouncement={async (title, message, type, expiresAt) => {
            try {
              await addAnnouncement(title, message, type, expiresAt, users.find(u => u.name === currentUser)?.id)
              addToast('Announcement created', 'success')
            } catch (err) {
              addToast('Failed to create announcement', 'error')
            }
          }}
          onEditAnnouncement={async (id, updates) => {
            try {
              await editAnnouncement(id, updates)
              addToast('Announcement updated', 'success')
            } catch (err) {
              addToast('Failed to update announcement', 'error')
            }
          }}
          onDeleteAnnouncement={async (id) => {
            try {
              await removeAnnouncement(id)
              addToast('Announcement deleted', 'success')
            } catch (err) {
              addToast('Failed to delete announcement', 'error')
            }
          }}
          bugReports={bugReports}
          onFetchBugReports={fetchBugReports}
          onEditBugReport={async (id, updates) => {
            try {
              await editBugReport(id, updates)
              addToast('Bug report updated', 'success')
            } catch (err) {
              addToast('Failed to update bug report', 'error')
            }
          }}
          onDeleteBugReport={async (id) => {
            try {
              await removeBugReport(id)
              addToast('Bug report deleted', 'success')
            } catch (err) {
              addToast('Failed to delete bug report', 'error')
            }
          }}
        />
      )}

      {/* Bug Report Modal */}
      {showBugReport && (
        <BugReportModal
          onClose={() => setShowBugReport(false)}
          onSubmit={async (title, description) => {
            const userProfile = users.find(u => u.name === currentUser)
            await submitBugReport(title, description, userProfile?.id, currentUser)
            addToast('Bug report submitted. Thank you!', 'success')
          }}
          darkMode={darkMode}
        />
      )}

      {/* My Bug Reports */}
      {showMyBugReports && (
        <MyBugReports
          onClose={() => setShowMyBugReports(false)}
          bugReports={bugReports}
          onFetchBugReports={fetchBugReports}
          userId={users.find(u => u.name === currentUser)?.id}
          darkMode={darkMode}
        />
      )}

      {/* PWA Install Prompt */}
      <InstallPrompt darkMode={darkMode} />

      {/* Guided Tour */}
      {showTour && (
        <GuidedTour
          onComplete={completeTutorial}
          onSkip={skipTour}
          darkMode={darkMode}
        />
      )}
    </div>
  )
}
