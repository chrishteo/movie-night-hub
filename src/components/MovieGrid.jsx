import MovieCard from './MovieCard'
import SkeletonCard from './SkeletonCard'

// List row component - more detailed view
function MovieListRow({
  movie,
  onToggleWatched,
  onToggleFavorite,
  onClick,
  onDelete,
  darkMode,
  bulkSelectMode,
  isSelected,
  onToggleSelect,
  canModify = true
}) {
  const card = darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
  const border = darkMode ? 'border-gray-700' : 'border-gray-200'
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500'

  return (
    <div
      className={`${card} border ${border} rounded-xl p-4 flex gap-4 cursor-pointer transition-all hover:shadow-lg`}
      onClick={() => !bulkSelectMode && onClick(movie)}
    >
      {/* Bulk select checkbox */}
      {bulkSelectMode && (
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(movie.id)}
            onClick={(e) => e.stopPropagation()}
            className="w-5 h-5 rounded border-gray-500 text-purple-600 focus:ring-purple-500"
          />
        </div>
      )}

      {/* Poster */}
      {movie.poster ? (
        <img
          src={movie.poster}
          alt=""
          className="w-16 h-24 object-cover rounded-lg shadow-md flex-shrink-0"
        />
      ) : (
        <div className={`w-16 h-24 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
          🎬
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
        {/* Top row: Title and badges */}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-lg truncate">{movie.title}</h3>
            {movie.year && <span className={`text-sm ${muted}`}>({movie.year})</span>}
            {movie.watched && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400">Watched</span>
            )}
            {movie.favorite && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400">♥ Favorite</span>
            )}
          </div>

          {/* Second row: Director and genre */}
          <div className={`flex items-center gap-3 mt-1 text-sm ${muted}`}>
            {movie.director && (
              <span className="flex items-center gap-1">
                <span className="opacity-60">Director:</span> {movie.director}
              </span>
            )}
            {movie.genre && (
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs">
                {movie.genre}
              </span>
            )}
            {movie.mood && (
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs">
                {movie.mood}
              </span>
            )}
          </div>
        </div>

        {/* Bottom row: Streaming and cast */}
        <div className={`flex items-center gap-4 mt-2 text-sm ${muted}`}>
          {movie.streaming && movie.streaming.length > 0 && (
            <span className="flex items-center gap-1">
              <span className="opacity-60">📺</span>
              <span className="truncate max-w-[150px]">{movie.streaming.slice(0, 2).join(', ')}</span>
            </span>
          )}
          {movie.cast && movie.cast.length > 0 && (
            <span className="hidden md:flex items-center gap-1">
              <span className="opacity-60">🎭</span>
              <span className="truncate max-w-[200px]">{movie.cast.slice(0, 2).join(', ')}</span>
            </span>
          )}
        </div>
      </div>

      {/* Ratings column */}
      <div className="hidden sm:flex flex-col items-end justify-center gap-2 flex-shrink-0">
        {/* Your rating */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(s => (
            <span key={s} className={`text-sm ${s <= (movie.rating || 0) ? 'text-yellow-400' : 'text-gray-600'}`}>★</span>
          ))}
        </div>

        {/* External ratings */}
        <div className="flex items-center gap-3 text-xs">
          {movie.tmdb_rating && (
            <span className="flex items-center gap-1">
              <span className="text-green-400">TMDB</span>
              <span className="font-medium">{movie.tmdb_rating.toFixed(1)}</span>
            </span>
          )}
          {movie.imdb_rating && (
            <span className="flex items-center gap-1">
              <span className="text-yellow-400">IMDb</span>
              <span className="font-medium">{movie.imdb_rating}</span>
            </span>
          )}
          {movie.rotten_tomatoes && (
            <span className="flex items-center gap-1">
              <span className="text-red-400">🍅</span>
              <span className="font-medium">{movie.rotten_tomatoes}%</span>
            </span>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-col justify-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onToggleWatched(movie.id)}
          className={`p-2 rounded-lg transition-colors ${
            movie.watched
              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              : darkMode ? 'bg-gray-700 text-gray-400 hover:text-green-400' : 'bg-gray-100 text-gray-400 hover:text-green-500'
          }`}
          title={movie.watched ? 'Mark unwatched' : 'Mark watched'}
        >
          ✓
        </button>
        <button
          onClick={() => onToggleFavorite(movie.id)}
          className={`p-2 rounded-lg transition-colors ${
            movie.favorite
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : darkMode ? 'bg-gray-700 text-gray-400 hover:text-red-400' : 'bg-gray-100 text-gray-400 hover:text-red-500'
          }`}
          title={movie.favorite ? 'Remove favorite' : 'Add favorite'}
        >
          ♥
        </button>
        {/* Only show delete button if user can modify this movie */}
        {canModify && (
          <button
            onClick={() => onDelete(movie.id)}
            className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 text-gray-400 hover:text-red-400 hover:bg-red-500/20' : 'bg-gray-100 text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
            title="Delete"
          >
            🗑
          </button>
        )}
      </div>
    </div>
  )
}

export default function MovieGrid({
  movies,
  users,
  onToggleWatched,
  onToggleFavorite,
  onEdit,
  onDelete,
  onMovieClick,
  onRate,
  darkMode,
  loading,
  bulkSelectMode,
  selectedMovies,
  onToggleSelect,
  viewMode = 'grid',
  canModifyMovie = () => true // Default to allowing modifications
}) {
  // Show skeleton loaders while loading
  if (loading) {
    return (
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3' : 'space-y-2'}>
        {[...Array(6)].map((_, i) => (
          viewMode === 'grid' ? (
            <SkeletonCard key={i} darkMode={darkMode} />
          ) : (
            <div
              key={i}
              className={`h-20 rounded-lg animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}
            />
          )
        ))}
      </div>
    )
  }

  if (movies.length === 0) {
    return (
      <div className="text-center py-12 opacity-50">
        No movies found
      </div>
    )
  }

  // List view
  if (viewMode === 'list') {
    return (
      <div className="space-y-2">
        {movies.map(movie => (
          <MovieListRow
            key={movie.id}
            movie={movie}
            onToggleWatched={onToggleWatched}
            onToggleFavorite={onToggleFavorite}
            onClick={onMovieClick}
            onDelete={onDelete}
            darkMode={darkMode}
            bulkSelectMode={bulkSelectMode}
            isSelected={selectedMovies?.has(movie.id)}
            onToggleSelect={onToggleSelect}
            canModify={canModifyMovie(movie)}
          />
        ))}
      </div>
    )
  }

  // Grid view (default)
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {movies.map(movie => (
        <MovieCard
          key={movie.id}
          movie={movie}
          users={users}
          onToggleWatched={onToggleWatched}
          onToggleFavorite={onToggleFavorite}
          onEdit={onEdit}
          onDelete={onDelete}
          onClick={onMovieClick}
          onRate={onRate}
          darkMode={darkMode}
          bulkSelectMode={bulkSelectMode}
          isSelected={selectedMovies?.has(movie.id)}
          onToggleSelect={onToggleSelect}
          canModify={canModifyMovie(movie)}
        />
      ))}
    </div>
  )
}
