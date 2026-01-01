import MovieCard from './MovieCard'
import SkeletonCard from './SkeletonCard'

// Compact list row component
function MovieListRow({
  movie,
  onToggleWatched,
  onToggleFavorite,
  onClick,
  onDelete,
  darkMode,
  bulkSelectMode,
  isSelected,
  onToggleSelect
}) {
  const card = darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
  const border = darkMode ? 'border-gray-700' : 'border-gray-200'

  return (
    <div
      className={`${card} border ${border} rounded-lg p-3 flex items-center gap-3 cursor-pointer transition-colors`}
      onClick={() => !bulkSelectMode && onClick(movie)}
    >
      {/* Bulk select checkbox */}
      {bulkSelectMode && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(movie.id)}
          onClick={(e) => e.stopPropagation()}
          className="w-5 h-5 rounded border-gray-500 text-purple-600 focus:ring-purple-500"
        />
      )}

      {/* Poster thumbnail */}
      {movie.poster ? (
        <img
          src={movie.poster}
          alt=""
          className="w-10 h-14 object-cover rounded flex-shrink-0"
        />
      ) : (
        <div className={`w-10 h-14 rounded flex items-center justify-center text-lg flex-shrink-0 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
          🎬
        </div>
      )}

      {/* Title and info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate">{movie.title}</h3>
          {movie.favorite && <span className="text-red-400">♥</span>}
          {movie.watched && <span className="text-green-400">✓</span>}
        </div>
        <div className="flex items-center gap-2 text-sm opacity-60">
          {movie.year && <span>{movie.year}</span>}
          {movie.genre && <span>• {movie.genre}</span>}
          {movie.director && <span className="hidden sm:inline">• {movie.director}</span>}
        </div>
      </div>

      {/* Rating */}
      <div className="hidden sm:flex items-center gap-0.5 text-yellow-400">
        {[1, 2, 3, 4, 5].map(s => (
          <span key={s} className={`text-sm ${s <= (movie.rating || 0) ? '' : 'opacity-30'}`}>★</span>
        ))}
      </div>

      {/* TMDB Rating */}
      {movie.tmdb_rating && (
        <div className="hidden md:flex items-center gap-1 text-sm">
          <span className="text-green-400">⭐</span>
          <span>{movie.tmdb_rating.toFixed(1)}</span>
        </div>
      )}

      {/* Quick actions */}
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onToggleWatched(movie.id)}
          className={`p-1.5 rounded transition-colors ${
            movie.watched
              ? 'text-green-400 hover:text-green-300'
              : darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
          }`}
          title={movie.watched ? 'Mark unwatched' : 'Mark watched'}
        >
          ✓
        </button>
        <button
          onClick={() => onToggleFavorite(movie.id)}
          className={`p-1.5 rounded transition-colors ${
            movie.favorite
              ? 'text-red-400 hover:text-red-300'
              : darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
          }`}
          title={movie.favorite ? 'Remove favorite' : 'Add favorite'}
        >
          ♥
        </button>
        <button
          onClick={() => onDelete(movie.id)}
          className={`p-1.5 rounded transition-colors ${darkMode ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
          title="Delete"
        >
          🗑️
        </button>
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
  viewMode = 'grid'
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
        />
      ))}
    </div>
  )
}
