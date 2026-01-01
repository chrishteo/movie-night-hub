import { formatDate } from '../utils/helpers'
import Modal from './Modal'

export default function WatchHistory({ movies, onClose, darkMode }) {
  const watchedMovies = movies
    .filter(m => m.watched && m.watched_at)
    .sort((a, b) => new Date(b.watched_at) - new Date(a.watched_at))

  const border = darkMode ? 'border-gray-700' : 'border-gray-300'

  return (
    <Modal title="📜 Watch History" onClose={onClose} darkMode={darkMode}>
      {watchedMovies.length === 0 ? (
        <p className="text-center py-8 opacity-50">
          No watched movies yet
        </p>
      ) : (
        <div className="space-y-2">
          {watchedMovies.map(movie => (
            <div
              key={movie.id}
              className={`p-2 rounded border ${border} flex gap-2 items-center`}
            >
              {movie.poster ? (
                <img
                  src={movie.poster}
                  alt=""
                  className="w-10 h-14 object-cover rounded"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              ) : (
                <div className="w-10 h-14 bg-gray-700 rounded flex items-center justify-center">
                  🎬
                </div>
              )}
              <div className="flex-1">
                <p className="font-bold text-sm">{movie.title}</p>
                <p className="text-xs opacity-70">
                  Watched {formatDate(movie.watched_at)}
                </p>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <span
                    key={s}
                    className={`text-xs ${
                      s <= movie.rating ? 'text-yellow-400' : 'text-gray-500'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
