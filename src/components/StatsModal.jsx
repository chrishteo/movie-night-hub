export default function StatsModal({ movies, onClose, darkMode }) {
  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const border = darkMode ? 'border-gray-700' : 'border-gray-300'
  const textMuted = darkMode ? 'text-gray-400' : 'text-gray-600'

  // Calculate statistics
  const totalMovies = movies.length
  const watchedMovies = movies.filter(m => m.watched).length
  const unwatchedMovies = totalMovies - watchedMovies
  const favoriteMovies = movies.filter(m => m.favorite).length

  // Average rating (only rated movies)
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

  // Users who added movies
  const userCounts = {}
  movies.forEach(m => {
    if (m.added_by) {
      userCounts[m.added_by] = (userCounts[m.added_by] || 0) + 1
    }
  })

  const maxGenreCount = topGenres.length > 0 ? topGenres[0][1] : 1

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40 overflow-auto">
      <div className={`${card} rounded-lg p-4 w-full max-w-lg max-h-[90vh] overflow-auto`}>
        <h2 className="text-xl font-bold mb-4">📊 Statistics</h2>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className={`p-3 rounded-lg border ${border} text-center`}>
            <p className="text-3xl font-bold text-purple-500">{totalMovies}</p>
            <p className={`text-sm ${textMuted}`}>Total Movies</p>
          </div>
          <div className={`p-3 rounded-lg border ${border} text-center`}>
            <p className="text-3xl font-bold text-yellow-500">{avgRating}</p>
            <p className={`text-sm ${textMuted}`}>Avg Rating</p>
          </div>
          <div className={`p-3 rounded-lg border ${border} text-center`}>
            <p className="text-3xl font-bold text-green-500">{watchedMovies}</p>
            <p className={`text-sm ${textMuted}`}>Watched</p>
          </div>
          <div className={`p-3 rounded-lg border ${border} text-center`}>
            <p className="text-3xl font-bold text-red-500">{favoriteMovies}</p>
            <p className={`text-sm ${textMuted}`}>Favorites</p>
          </div>
        </div>

        {/* Watch Progress */}
        <div className="mb-6">
          <p className="text-sm font-semibold mb-2">Watch Progress</p>
          <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
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
        <div className="mb-6">
          <p className="text-sm font-semibold mb-2">Rating Distribution</p>
          <div className="flex items-end gap-2 h-20">
            {ratingCounts.map((count, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-yellow-500 rounded-t transition-all"
                  style={{
                    height: `${ratedMovies.length > 0 ? (count / Math.max(...ratingCounts)) * 100 : 0}%`,
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
          <div className="mb-6">
            <p className="text-sm font-semibold mb-2">Top Genres</p>
            <div className="space-y-2">
              {topGenres.map(([genre, count]) => (
                <div key={genre} className="flex items-center gap-2">
                  <span className="w-24 text-sm truncate">{genre}</span>
                  <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
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

        {/* Top Moods */}
        {topMoods.length > 0 && (
          <div className="mb-6">
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

        {/* Top Streaming */}
        {topStreaming.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-semibold mb-2">Streaming Services</p>
            <div className="flex flex-wrap gap-2">
              {topStreaming.map(([service, count]) => (
                <span key={service} className="px-2 py-1 bg-gray-600 rounded text-sm">
                  {service} ({count})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Movies by User */}
        {Object.keys(userCounts).length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold mb-2">Added by</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(userCounts).map(([user, count]) => (
                <span key={user} className="px-2 py-1 bg-gray-600 rounded text-sm">
                  {user}: {count}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
        >
          Close
        </button>
      </div>
    </div>
  )
}
