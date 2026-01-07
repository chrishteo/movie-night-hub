import { useState, useEffect } from 'react'
import Modal from './Modal'
import { getCollections } from '../lib/database'

export default function StatsModal({
  movies,
  users = [],
  votingSessions = [],
  invites = [],
  onClose,
  darkMode
}) {
  const [activeTab, setActiveTab] = useState('overview')
  const [collections, setCollections] = useState([])

  // Fetch collections for stats
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const data = await getCollections()
        setCollections(data || [])
      } catch (err) {
        console.error('Error fetching collections:', err)
      }
    }
    fetchCollections()
  }, [])
  const border = darkMode ? 'border-gray-700' : 'border-gray-300'
  const textMuted = darkMode ? 'text-gray-400' : 'text-gray-600'
  const cardBg = darkMode ? 'bg-gray-700' : 'bg-gray-100'

  // ============ OVERVIEW STATS ============
  const totalMovies = movies.length
  const watchedMovies = movies.filter(m => m.watched).length
  const ratedMovies = movies.filter(m => m.rating > 0)
  const avgRating = ratedMovies.length > 0
    ? (ratedMovies.reduce((sum, m) => sum + m.rating, 0) / ratedMovies.length).toFixed(1)
    : 0

  // Genre distribution
  const genreCounts = {}
  movies.forEach(m => {
    if (m.genre) {
      genreCounts[m.genre] = (genreCounts[m.genre] || 0) + 1
    }
  })
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Mood distribution
  const moodCounts = {}
  movies.forEach(m => {
    if (m.mood) {
      moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1
    }
  })
  const topMoods = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Rating distribution
  const ratingCounts = [0, 0, 0, 0, 0]
  movies.forEach(m => {
    if (m.rating > 0) {
      ratingCounts[m.rating - 1]++
    }
  })

  // Streaming distribution
  const streamingCounts = {}
  movies.forEach(m => {
    if (m.streaming) {
      m.streaming.forEach(s => {
        streamingCounts[s] = (streamingCounts[s] || 0) + 1
      })
    }
  })
  const topStreaming = Object.entries(streamingCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const maxGenreCount = topGenres.length > 0 ? topGenres[0][1] : 1

  // ============ USER ACTIVITY STATS ============
  const userActivity = users.map(user => {
    const moviesAdded = movies.filter(m => m.added_by === user.name).length
    const sessionsCreated = votingSessions.filter(s => s.created_by === user.auth_id).length
    const sessionsParticipated = votingSessions.filter(s =>
      s.participants?.some(p => p.user_id === user.auth_id)
    ).length
    return {
      ...user,
      moviesAdded,
      sessionsCreated,
      sessionsParticipated,
      totalActivity: moviesAdded + sessionsCreated + sessionsParticipated
    }
  }).sort((a, b) => b.totalActivity - a.totalActivity)

  // ============ VOTING STATS ============
  const totalSessions = votingSessions.length
  const completedSessions = votingSessions.filter(s => s.status === 'completed').length
  const activeSessions = votingSessions.filter(s => s.status === 'active').length
  const completionRate = totalSessions > 0
    ? Math.round((completedSessions / totalSessions) * 100)
    : 0

  // Most picked movies (winners)
  const winnerCounts = {}
  votingSessions.forEach(s => {
    if (s.winner_movie_id) {
      const movie = movies.find(m => m.id === s.winner_movie_id)
      if (movie) {
        winnerCounts[movie.title] = (winnerCounts[movie.title] || 0) + 1
      }
    }
  })
  const topWinners = Object.entries(winnerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Average participants per session
  const avgParticipants = totalSessions > 0
    ? (votingSessions.reduce((sum, s) => sum + (s.participants?.length || 0), 0) / totalSessions).toFixed(1)
    : 0

  // ============ WATCH INVITES STATS ============
  const totalInvites = invites.length
  const acceptedInvites = invites.filter(i => i.status === 'accepted').length
  const declinedInvites = invites.filter(i => i.status === 'declined').length
  const pendingInvites = invites.filter(i => i.status === 'pending').length
  const acceptRate = totalInvites > 0
    ? Math.round((acceptedInvites / (acceptedInvites + declinedInvites || 1)) * 100)
    : 0

  // Invite stats per user
  const userInviteStats = users.map(user => {
    const userInvites = invites.filter(i => i.user_id === user.auth_id)
    const accepted = userInvites.filter(i => i.status === 'accepted').length
    const declined = userInvites.filter(i => i.status === 'declined').length
    return {
      ...user,
      received: userInvites.length,
      accepted,
      declined,
      rate: userInvites.length > 0 ? Math.round((accepted / userInvites.length) * 100) : 0
    }
  }).filter(u => u.received > 0).sort((a, b) => b.received - a.received)

  // ============ TIME-BASED STATS ============
  const now = new Date()
  const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
  const oneMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)

  const moviesThisWeek = movies.filter(m => new Date(m.created_at) > oneWeekAgo).length
  const moviesThisMonth = movies.filter(m => new Date(m.created_at) > oneMonthAgo).length
  const watchedThisWeek = movies.filter(m => m.watched && m.watched_at && new Date(m.watched_at) > oneWeekAgo).length
  const watchedThisMonth = movies.filter(m => m.watched && m.watched_at && new Date(m.watched_at) > oneMonthAgo).length
  const sessionsThisWeek = votingSessions.filter(s => new Date(s.created_at) > oneWeekAgo).length
  const sessionsThisMonth = votingSessions.filter(s => new Date(s.created_at) > oneMonthAgo).length

  // Activity by day of week
  const dayOfWeekActivity = [0, 0, 0, 0, 0, 0, 0] // Sun-Sat
  movies.forEach(m => {
    if (m.created_at) {
      const day = new Date(m.created_at).getDay()
      dayOfWeekActivity[day]++
    }
  })
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const maxDayActivity = Math.max(...dayOfWeekActivity, 1)

  // ============ COLLECTIONS STATS ============
  const totalCollections = collections.length
  const sharedCollections = collections.filter(c => c.shares && c.shares.length > 0).length
  const privateCollections = totalCollections - sharedCollections

  // Collections by movie count
  const collectionsWithCounts = collections.map(c => ({
    ...c,
    movieCount: c.movies?.length || 0
  })).sort((a, b) => b.movieCount - a.movieCount)

  const topCollections = collectionsWithCounts.slice(0, 5)
  const avgMoviesPerCollection = totalCollections > 0
    ? (collectionsWithCounts.reduce((sum, c) => sum + c.movieCount, 0) / totalCollections).toFixed(1)
    : 0

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'voting', label: 'Voting', icon: '🗳️' },
    { id: 'invites', label: 'Invites', icon: '📩' },
    { id: 'activity', label: 'Activity', icon: '📈' },
    { id: 'collections', label: 'Collections', icon: '📚' }
  ]

  return (
    <Modal title="📊 Admin Statistics" onClose={onClose} darkMode={darkMode} maxWidth="max-w-2xl">
      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className={`p-3 rounded-lg border ${border} text-center`}>
              <p className="text-3xl font-bold text-purple-500">{totalMovies}</p>
              <p className={`text-sm ${textMuted}`}>Total Movies</p>
            </div>
            <div className={`p-3 rounded-lg border ${border} text-center`}>
              <p className="text-3xl font-bold text-green-500">{watchedMovies}</p>
              <p className={`text-sm ${textMuted}`}>Watched</p>
            </div>
            <div className={`p-3 rounded-lg border ${border} text-center`}>
              <p className="text-3xl font-bold text-yellow-500">{avgRating}</p>
              <p className={`text-sm ${textMuted}`}>Avg Rating</p>
            </div>
          </div>

          {/* Watch Progress */}
          <div>
            <p className="text-sm font-semibold mb-2">Watch Progress</p>
            <div className={`h-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded-full overflow-hidden`}>
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${totalMovies > 0 ? (watchedMovies / totalMovies) * 100 : 0}%` }}
              />
            </div>
            <p className={`text-xs ${textMuted} mt-1`}>
              {watchedMovies} of {totalMovies} watched ({totalMovies > 0 ? Math.round((watchedMovies / totalMovies) * 100) : 0}%)
            </p>
          </div>

          {/* Rating Distribution */}
          <div>
            <p className="text-sm font-semibold mb-2">Rating Distribution</p>
            <div className="flex items-end gap-2 h-20">
              {ratingCounts.map((count, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-yellow-500 rounded-t transition-all"
                    style={{
                      height: `${ratedMovies.length > 0 ? (count / Math.max(...ratingCounts, 1)) * 100 : 0}%`,
                      minHeight: count > 0 ? '8px' : '0'
                    }}
                  />
                  <span className="text-xs mt-1">{i + 1}★</span>
                  <span className={`text-xs ${textMuted}`}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Genres */}
          {topGenres.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2">Top Genres</p>
              <div className="space-y-2">
                {topGenres.map(([genre, count]) => (
                  <div key={genre} className="flex items-center gap-2">
                    <span className="w-24 text-sm truncate">{genre}</span>
                    <div className={`flex-1 h-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded-full overflow-hidden`}>
                      <div
                        className="h-full bg-purple-500"
                        style={{ width: `${(count / maxGenreCount) * 100}%` }}
                      />
                    </div>
                    <span className={`text-sm ${textMuted} w-8 text-right`}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Moods & Streaming in a row */}
          <div className="grid grid-cols-2 gap-4">
            {topMoods.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">Top Moods</p>
                <div className="flex flex-wrap gap-2">
                  {topMoods.map(([mood, count]) => (
                    <span key={mood} className="px-2 py-1 bg-blue-600 rounded text-sm">
                      {mood} ({count})
                    </span>
                  ))}
                </div>
              </div>
            )}
            {topStreaming.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">Streaming</p>
                <div className="flex flex-wrap gap-2">
                  {topStreaming.map(([service, count]) => (
                    <span key={service} className={`px-2 py-1 ${cardBg} rounded text-sm`}>
                      {service} ({count})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-lg border ${border} text-center`}>
              <p className="text-3xl font-bold text-blue-500">{users.length}</p>
              <p className={`text-sm ${textMuted}`}>Total Users</p>
            </div>
            <div className={`p-3 rounded-lg border ${border} text-center`}>
              <p className="text-3xl font-bold text-green-500">{userActivity.filter(u => u.totalActivity > 0).length}</p>
              <p className={`text-sm ${textMuted}`}>Active Users</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2">User Activity Leaderboard</p>
            <div className="space-y-2">
              {userActivity.map((user, i) => (
                <div key={user.id} className={`p-3 rounded-lg ${cardBg} flex items-center gap-3`}>
                  <span className="text-lg">{i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}</span>
                  <span className="text-xl">{user.avatar || '👤'}</span>
                  <div className="flex-1">
                    <p className="font-medium">{user.name}</p>
                    <p className={`text-xs ${textMuted}`}>
                      {user.moviesAdded} movies • {user.sessionsCreated} sessions created • {user.sessionsParticipated} participated
                    </p>
                  </div>
                  <span className="text-lg font-bold text-purple-500">{user.totalActivity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Voting Tab */}
      {activeTab === 'voting' && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div className={`p-3 rounded-lg border ${border} text-center`}>
              <p className="text-2xl font-bold text-blue-500">{totalSessions}</p>
              <p className={`text-xs ${textMuted}`}>Total Sessions</p>
            </div>
            <div className={`p-3 rounded-lg border ${border} text-center`}>
              <p className="text-2xl font-bold text-green-500">{completedSessions}</p>
              <p className={`text-xs ${textMuted}`}>Completed</p>
            </div>
            <div className={`p-3 rounded-lg border ${border} text-center`}>
              <p className="text-2xl font-bold text-yellow-500">{activeSessions}</p>
              <p className={`text-xs ${textMuted}`}>Active</p>
            </div>
            <div className={`p-3 rounded-lg border ${border} text-center`}>
              <p className="text-2xl font-bold text-purple-500">{completionRate}%</p>
              <p className={`text-xs ${textMuted}`}>Completion</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-lg border ${border} text-center`}>
              <p className="text-2xl font-bold text-cyan-500">{avgParticipants}</p>
              <p className={`text-xs ${textMuted}`}>Avg Participants</p>
            </div>
            <div className={`p-3 rounded-lg border ${border} text-center`}>
              <p className="text-2xl font-bold text-orange-500">{topWinners.length}</p>
              <p className={`text-xs ${textMuted}`}>Unique Winners</p>
            </div>
          </div>

          {topWinners.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2">Most Picked Movies</p>
              <div className="space-y-2">
                {topWinners.map(([title, count], i) => (
                  <div key={title} className={`p-2 rounded ${cardBg} flex items-center gap-2`}>
                    <span>{['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]}</span>
                    <span className="flex-1 truncate">{title}</span>
                    <span className="font-bold text-green-500">{count}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invites Tab */}
      {activeTab === 'invites' && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div className={`p-3 rounded-lg border ${border} text-center`}>
              <p className="text-2xl font-bold text-blue-500">{totalInvites}</p>
              <p className={`text-xs ${textMuted}`}>Total</p>
            </div>
            <div className={`p-3 rounded-lg border ${border} text-center`}>
              <p className="text-2xl font-bold text-green-500">{acceptedInvites}</p>
              <p className={`text-xs ${textMuted}`}>Accepted</p>
            </div>
            <div className={`p-3 rounded-lg border ${border} text-center`}>
              <p className="text-2xl font-bold text-red-500">{declinedInvites}</p>
              <p className={`text-xs ${textMuted}`}>Declined</p>
            </div>
            <div className={`p-3 rounded-lg border ${border} text-center`}>
              <p className="text-2xl font-bold text-yellow-500">{pendingInvites}</p>
              <p className={`text-xs ${textMuted}`}>Pending</p>
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${border} text-center`}>
            <p className="text-4xl font-bold text-green-500">{acceptRate}%</p>
            <p className={`text-sm ${textMuted}`}>Overall Accept Rate</p>
          </div>

          {userInviteStats.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2">Invites by User</p>
              <div className="space-y-2">
                {userInviteStats.map(user => (
                  <div key={user.id} className={`p-3 rounded-lg ${cardBg} flex items-center gap-3`}>
                    <span className="text-xl">{user.avatar || '👤'}</span>
                    <div className="flex-1">
                      <p className="font-medium">{user.name}</p>
                      <p className={`text-xs ${textMuted}`}>
                        {user.accepted} accepted • {user.declined} declined
                      </p>
                    </div>
                    <span className={`font-bold ${user.rate >= 70 ? 'text-green-500' : user.rate >= 40 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {user.rate}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className={`p-3 rounded-lg border ${border} text-center`}>
              <p className="text-2xl font-bold text-purple-500">{moviesThisWeek}</p>
              <p className={`text-xs ${textMuted}`}>Movies This Week</p>
            </div>
            <div className={`p-3 rounded-lg border ${border} text-center`}>
              <p className="text-2xl font-bold text-green-500">{watchedThisWeek}</p>
              <p className={`text-xs ${textMuted}`}>Watched This Week</p>
            </div>
            <div className={`p-3 rounded-lg border ${border} text-center`}>
              <p className="text-2xl font-bold text-blue-500">{sessionsThisWeek}</p>
              <p className={`text-xs ${textMuted}`}>Sessions This Week</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className={`p-3 rounded-lg border ${border} text-center`}>
              <p className="text-2xl font-bold text-purple-400">{moviesThisMonth}</p>
              <p className={`text-xs ${textMuted}`}>Movies This Month</p>
            </div>
            <div className={`p-3 rounded-lg border ${border} text-center`}>
              <p className="text-2xl font-bold text-green-400">{watchedThisMonth}</p>
              <p className={`text-xs ${textMuted}`}>Watched This Month</p>
            </div>
            <div className={`p-3 rounded-lg border ${border} text-center`}>
              <p className="text-2xl font-bold text-blue-400">{sessionsThisMonth}</p>
              <p className={`text-xs ${textMuted}`}>Sessions This Month</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2">Movies Added by Day of Week</p>
            <div className="flex items-end gap-2 h-24">
              {dayOfWeekActivity.map((count, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-purple-500 rounded-t transition-all"
                    style={{
                      height: `${(count / maxDayActivity) * 100}%`,
                      minHeight: count > 0 ? '8px' : '0'
                    }}
                  />
                  <span className="text-xs mt-1">{dayNames[i]}</span>
                  <span className={`text-xs ${textMuted}`}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Collections Tab */}
      {activeTab === 'collections' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className={`p-3 rounded-lg border ${border} text-center`}>
              <p className="text-2xl font-bold text-cyan-500">{totalCollections}</p>
              <p className={`text-xs ${textMuted}`}>Total</p>
            </div>
            <div className={`p-3 rounded-lg border ${border} text-center`}>
              <p className="text-2xl font-bold text-green-500">{sharedCollections}</p>
              <p className={`text-xs ${textMuted}`}>Shared</p>
            </div>
            <div className={`p-3 rounded-lg border ${border} text-center`}>
              <p className="text-2xl font-bold text-gray-500">{privateCollections}</p>
              <p className={`text-xs ${textMuted}`}>Private</p>
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${border} text-center`}>
            <p className="text-3xl font-bold text-purple-500">{avgMoviesPerCollection}</p>
            <p className={`text-sm ${textMuted}`}>Avg Movies per Collection</p>
          </div>

          {topCollections.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2">Largest Collections</p>
              <div className="space-y-2">
                {topCollections.map((col, i) => (
                  <div key={col.id} className={`p-3 rounded-lg ${cardBg} flex items-center gap-3`}>
                    <span className="text-xl">{col.emoji || '📁'}</span>
                    <div className="flex-1">
                      <p className="font-medium">{col.name}</p>
                      <p className={`text-xs ${textMuted}`}>
                        {col.shares?.length > 0 ? `Shared with ${col.shares.length}` : 'Private'}
                      </p>
                    </div>
                    <span className="font-bold text-purple-500">{col.movieCount} movies</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalCollections === 0 && (
            <p className={`text-center ${textMuted} py-8`}>No collections created yet</p>
          )}
        </div>
      )}
    </Modal>
  )
}
