import { useState, useRef } from 'react'
import { STREAMING_COLORS } from '../utils/constants'
import { Avatar } from './AvatarPicker'

function StreamingBadge({ service }) {
  return (
    <span className={`px-1.5 py-0.5 rounded text-xs text-white ${STREAMING_COLORS[service] || 'bg-gray-500'}`}>
      {service}
    </span>
  )
}

export default function MovieCard({
  movie,
  users,
  onToggleWatched,
  onEdit,
  onDelete,
  onClick,
  onRate,
  darkMode,
  bulkSelectMode,
  isSelected,
  onToggleSelect,
  canModify = true,
  // Per-user status props
  myStatus,
  averageRating,
  ratingCount = 0,
  watchedCount = 0,
  onToggleMyWatched,
  onRateMe
}) {
  // Find user who added this movie
  const addedByUser = users?.find(u => u.name === movie.added_by)
  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const border = darkMode ? 'border-gray-700' : 'border-gray-300'

  // Swipe state
  const [swipeX, setSwipeX] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const startX = useRef(0)
  const startY = useRef(0)

  // Animation states
  const [checkBounce, setCheckBounce] = useState(false)

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    setSwiping(true)
  }

  const handleTouchMove = (e) => {
    if (!swiping) return
    const deltaX = e.touches[0].clientX - startX.current
    const deltaY = Math.abs(e.touches[0].clientY - startY.current)

    // If scrolling vertically, don't swipe
    if (deltaY > 30) {
      setSwiping(false)
      setSwipeX(0)
      return
    }

    setSwipeX(deltaX)
  }

  const handleTouchEnd = () => {
    if (swipeX > 80) {
      // Swipe right - mark watched (per-user if available, else global)
      setCheckBounce(true)
      setTimeout(() => setCheckBounce(false), 300)
      if (onToggleMyWatched) {
        onToggleMyWatched(movie.id)
      } else {
        onToggleWatched(movie.id)
      }
    }
    setSwiping(false)
    setSwipeX(0)
  }

  const handleWatchedClick = (e) => {
    e.stopPropagation()
    setCheckBounce(true)
    setTimeout(() => setCheckBounce(false), 300)
    // Use per-user watched if available, else global
    if (onToggleMyWatched) {
      onToggleMyWatched(movie.id)
    } else {
      onToggleWatched(movie.id)
    }
  }

  // Determine watched state - prefer per-user status if available
  const isWatchedByMe = myStatus?.watched ?? false
  const myRating = myStatus?.rating ?? 0

  // Swipe indicator colors
  const swipeStyle = {
    transform: `translateX(${swipeX * 0.3}px)`,
    transition: swiping ? 'none' : 'transform 0.2s ease-out'
  }

  return (
    <div className="relative overflow-hidden rounded-lg animate-slide-in">
      {/* Swipe background indicator */}
      <div className={`absolute inset-0 flex items-center justify-start pl-4 bg-green-500 transition-opacity ${swipeX > 40 ? 'opacity-100' : 'opacity-0'}`}>
        <span className="text-white text-2xl">✓</span>
      </div>

      <div
        className={`${card} border ${border} flex flex-col cursor-pointer hover:border-purple-500 transition-colors relative ${isSelected ? 'ring-2 ring-purple-500' : ''}`}
        style={swipeStyle}
        onClick={() => bulkSelectMode ? onToggleSelect(movie.id) : onClick(movie)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
      <div className="flex">
        <div className="relative flex-shrink-0">
          {movie.poster ? (
            <img
              src={movie.poster}
              alt={movie.title}
              className="w-20 h-28 object-cover"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          ) : (
            <div className="w-20 h-28 bg-gray-700 flex items-center justify-center text-2xl">
              🎬
            </div>
          )}
          {bulkSelectMode && (
            <div className={`absolute top-1 left-1 w-6 h-6 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-purple-600 border-purple-600' : 'bg-black/50 border-white'}`}>
              {isSelected && <span className="text-white text-sm">✓</span>}
            </div>
          )}
        </div>
        <div className="p-2 flex-1 min-w-0">
          <div className="flex justify-between items-start gap-1">
            <h3 className="font-bold text-sm truncate">{movie.title}</h3>
            {/* Only show edit/delete if user can modify this movie */}
            {canModify && (
              <div className="flex gap-0.5 flex-shrink-0">
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
            )}
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
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {/* Per-user rating stars (if available) */}
            {onRateMe ? (
              <div className="flex gap-0.5" title="Your rating">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    onClick={(e) => { e.stopPropagation(); onRateMe(movie.id, s); }}
                    className={`text-xs ${s <= myRating ? 'text-yellow-400' : 'text-gray-500'} hover:text-yellow-300 hover:scale-125 transition-transform`}
                  >
                    ★
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    onClick={(e) => { e.stopPropagation(); onRate && onRate(movie.id, s); }}
                    className={`text-xs ${s <= movie.rating ? 'text-yellow-400' : 'text-gray-500'} hover:text-yellow-300 hover:scale-125 transition-transform`}
                  >
                    ★
                  </button>
                ))}
              </div>
            )}
            {/* Average rating from all users */}
            {averageRating != null && ratingCount > 0 && (
              <span className="text-xs text-gray-400" title={`Average from ${ratingCount} user${ratingCount > 1 ? 's' : ''}`}>
                Avg: {averageRating.toFixed(1)}★ ({ratingCount})
              </span>
            )}
            {movie.imdb_rating ? (
              <span className="px-1 py-0.5 bg-amber-500 rounded text-xs font-bold" title="IMDB">
                {movie.imdb_rating.toFixed(1)}
              </span>
            ) : movie.tmdb_rating ? (
              <span className="px-1 py-0.5 bg-yellow-600 rounded text-xs font-bold" title="TMDB">
                {movie.tmdb_rating.toFixed(1)}
              </span>
            ) : null}
            {movie.rotten_tomatoes && (
              <span className={`px-1 py-0.5 rounded text-xs font-bold ${movie.rotten_tomatoes >= 60 ? 'bg-red-500' : 'bg-green-600'}`} title="Rotten Tomatoes">
                {movie.rotten_tomatoes}%
              </span>
            )}
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
        <div className="flex items-center gap-1">
          <Avatar avatar={addedByUser?.avatar} size="sm" />
          <span className="text-xs opacity-50">{movie.added_by}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Show how many users have watched (if per-user tracking enabled) */}
          {watchedCount > 0 && (
            <span className="text-xs text-gray-400" title={`${watchedCount} user${watchedCount > 1 ? 's' : ''} watched`}>
              ({watchedCount} watched)
            </span>
          )}
          <button
            onClick={handleWatchedClick}
            className={`px-2 py-0.5 rounded text-xs ${
              onToggleMyWatched
                ? (isWatchedByMe ? 'bg-green-600' : 'bg-gray-600')
                : (movie.watched ? 'bg-green-600' : 'bg-gray-600')
            } hover:opacity-80 ${checkBounce ? 'animate-check-bounce' : ''}`}
          >
            {onToggleMyWatched
              ? (isWatchedByMe ? '✓ Watched' : 'Unwatched')
              : (movie.watched ? '✓ Watched' : 'Unwatched')
            }
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}
