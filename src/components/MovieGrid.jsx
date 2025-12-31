import MovieCard from './MovieCard'
import SkeletonCard from './SkeletonCard'

export default function MovieGrid({
  movies,
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
  onToggleSelect
}) {
  // Show skeleton loaders while loading
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <SkeletonCard key={i} darkMode={darkMode} />
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {movies.map(movie => (
        <MovieCard
          key={movie.id}
          movie={movie}
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
