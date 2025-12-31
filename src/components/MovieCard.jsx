import { STREAMING_COLORS } from '../utils/constants'

function StreamingBadge({ service }) {
  return (
    <span className={`px-1.5 py-0.5 rounded text-xs text-white ${STREAMING_COLORS[service] || 'bg-gray-500'}`}>
      {service}
    </span>
  )
}

export default function MovieCard({
  movie,
  onToggleWatched,
  onToggleFavorite,
  onEdit,
  onDelete,
  onClick,
  darkMode
}) {
  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const border = darkMode ? 'border-gray-700' : 'border-gray-300'

  return (
    <div
      className={`${card} rounded-lg overflow-hidden border ${border} flex flex-col cursor-pointer hover:border-purple-500 transition-colors`}
      onClick={() => onClick(movie)}
    >
      <div className="flex">
        {movie.poster ? (
          <img
            src={movie.poster}
            alt={movie.title}
            className="w-20 h-28 object-cover flex-shrink-0"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        ) : (
          <div className="w-20 h-28 bg-gray-700 flex items-center justify-center text-2xl flex-shrink-0">
            🎬
          </div>
        )}
        <div className="p-2 flex-1 min-w-0">
          <div className="flex justify-between items-start gap-1">
            <h3 className="font-bold text-sm truncate">{movie.title}</h3>
            <div className="flex gap-0.5 flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(movie.id); }}
                className={`text-sm px-1 rounded ${movie.favorite ? 'text-red-500 bg-red-500/20' : 'text-gray-400'} hover:text-red-400`}
                title={movie.favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                {movie.favorite ? '♥' : '♡'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(movie); }}
                className="text-xs text-gray-400 hover:text-gray-200"
              >
                ✏️
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(movie.id); }}
                className="text-xs text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </div>
          </div>
          <p className="text-xs opacity-70 truncate">
            {movie.director} {movie.director && movie.year && '•'} {movie.year}
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {movie.genre && (
              <span className="px-1 py-0.5 bg-purple-600 rounded text-xs text-white">
                {movie.genre}
              </span>
            )}
            {movie.mood && (
              <span className="px-1 py-0.5 bg-blue-600 rounded text-xs text-white">
                {movie.mood}
              </span>
            )}
          </div>
          <div className="flex gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map(s => (
              <span
                key={s}
                className={`text-xs ${s <= movie.rating ? 'text-yellow-400' : 'text-gray-500'}`}
              >
                ★
              </span>
            ))}
          </div>
        </div>
      </div>
      {movie.streaming?.length > 0 && (
        <div className="px-2 pb-1 flex flex-wrap gap-1">
          {movie.streaming.map(s => (
            <StreamingBadge key={s} service={s} />
          ))}
        </div>
      )}
      <div className="flex items-center justify-between mt-auto p-2 pt-1">
        <span className="text-xs opacity-50">{movie.added_by}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleWatched(movie.id); }}
          className={`px-2 py-0.5 rounded text-xs ${
            movie.watched ? 'bg-green-600' : 'bg-gray-600'
          } hover:opacity-80`}
        >
          {movie.watched ? '✓ Watched' : 'Unwatched'}
        </button>
      </div>
    </div>
  )
}
