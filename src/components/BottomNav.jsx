export default function BottomNav({
  onAddMovie,
  onSpinWheel,
  onVote,
  onShowRecs,
  onShowStats,
  darkMode
}) {
  const bg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'

  return (
    <nav className={`md:hidden fixed bottom-0 left-0 right-0 ${bg} border-t z-30 safe-area-bottom`}>
      <div className="flex justify-around items-center h-16">
        <button
          onClick={onAddMovie}
          className="flex flex-col items-center justify-center w-16 h-full text-purple-500 active:bg-purple-500/20 transition-colors"
        >
          <span className="text-xl">+</span>
          <span className="text-xs mt-0.5">Add</span>
        </button>
        <button
          onClick={onSpinWheel}
          className="flex flex-col items-center justify-center w-16 h-full text-green-500 active:bg-green-500/20 transition-colors"
        >
          <span className="text-xl">🎡</span>
          <span className="text-xs mt-0.5">Spin</span>
        </button>
        <button
          onClick={onVote}
          className="flex flex-col items-center justify-center w-16 h-full text-blue-500 active:bg-blue-500/20 transition-colors"
        >
          <span className="text-xl">🗳️</span>
          <span className="text-xs mt-0.5">Vote</span>
        </button>
        <button
          onClick={onShowRecs}
          className="flex flex-col items-center justify-center w-16 h-full text-orange-500 active:bg-orange-500/20 transition-colors"
        >
          <span className="text-xl">💡</span>
          <span className="text-xs mt-0.5">Ideas</span>
        </button>
        <button
          onClick={onShowStats}
          className="flex flex-col items-center justify-center w-16 h-full text-indigo-500 active:bg-indigo-500/20 transition-colors"
        >
          <span className="text-xl">📊</span>
          <span className="text-xs mt-0.5">Stats</span>
        </button>
      </div>
    </nav>
  )
}
