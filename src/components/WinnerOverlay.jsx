export default function WinnerOverlay({ movie, onClose }) {
  if (!movie) return null

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 cursor-pointer"
      onClick={onClose}
    >
      <div className="text-center animate-pulse">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-3xl font-bold text-yellow-400 mb-2">Winner!</h2>
        <p className="text-2xl text-white">{movie.title}</p>
        {movie.poster && (
          <img
            src={movie.poster}
            alt={movie.title}
            className="w-48 mx-auto mt-4 rounded-lg shadow-2xl"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        )}
        <p className="text-sm text-gray-400 mt-4">Click anywhere to close</p>
      </div>
    </div>
  )
}
