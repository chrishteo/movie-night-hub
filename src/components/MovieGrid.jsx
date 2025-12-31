import MovieCard from './MovieCard'

export default function MovieGrid({
  movies,
  onToggleWatched,
  onToggleFavorite,
  onEdit,
  onDelete,
  darkMode
}) {
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
          darkMode={darkMode}
        />
      ))}
    </div>
  )
}
