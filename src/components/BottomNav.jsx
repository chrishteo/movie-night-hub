export default function BottomNav({
  onAddMovie,
  onSpinWheel,
  onVote,
  onShowRecs,
  onShowStats,
  onShowTrending,
  onShowScheduler,
  onShowHistory,
  onShowShare,
  onShowCollections,
  onToggleBulkSelect,
  bulkSelectMode,
  onShowInvites,
  invitePendingCount = 0,
  sessionInviteCount = 0,
  isAdmin = false,
  darkMode
}) {
  const bg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'

  return (
    <nav className={`md:hidden fixed bottom-0 left-0 right-0 ${bg} border-t z-30 safe-area-bottom`}>
      <div className="flex items-center h-16 overflow-x-auto scrollbar-hide">
        <button
          onClick={onAddMovie}
          className="flex flex-col items-center justify-center min-w-[4.5rem] h-full text-purple-500 active:bg-purple-500/20 transition-colors"
          data-tour="add-movie-mobile"
        >
          <span className="text-xl">+</span>
          <span className="text-xs mt-0.5">Add</span>
        </button>
        <button
          onClick={onToggleBulkSelect}
          className={`flex flex-col items-center justify-center min-w-[4.5rem] h-full transition-colors ${
            bulkSelectMode ? 'text-purple-500 bg-purple-500/20' : 'text-gray-500 active:bg-gray-500/20'
          }`}
        >
          <span className="text-xl">☑️</span>
          <span className="text-xs mt-0.5">Select</span>
        </button>
        <button
          onClick={onShowTrending}
          className="flex flex-col items-center justify-center min-w-[4.5rem] h-full text-red-500 active:bg-red-500/20 transition-colors"
        >
          <span className="text-xl">🔥</span>
          <span className="text-xs mt-0.5">Hot</span>
        </button>
        <button
          onClick={onSpinWheel}
          className="flex flex-col items-center justify-center min-w-[4.5rem] h-full text-green-500 active:bg-green-500/20 transition-colors"
          data-tour="spin-wheel-mobile"
        >
          <span className="text-xl">🎡</span>
          <span className="text-xs mt-0.5">Spin</span>
        </button>
        <button
          onClick={onShowInvites}
          className="flex flex-col items-center justify-center min-w-[4.5rem] h-full text-emerald-500 active:bg-emerald-500/20 transition-colors relative"
        >
          <span className="text-xl">📩</span>
          <span className="text-xs mt-0.5">Invites</span>
          {invitePendingCount > 0 && (
            <span className="absolute top-1 right-2 bg-red-500 text-white text-xs rounded-full min-w-[1.25rem] h-5 flex items-center justify-center font-bold px-1">
              {invitePendingCount > 9 ? '9+' : invitePendingCount}
            </span>
          )}
        </button>
        <button
          onClick={onVote}
          className="flex flex-col items-center justify-center min-w-[4.5rem] h-full text-blue-500 active:bg-blue-500/20 transition-colors relative"
          data-tour="voting-mobile"
        >
          <span className="text-xl">🗳️</span>
          <span className="text-xs mt-0.5">Vote</span>
          {sessionInviteCount > 0 && (
            <>
              <span className="absolute top-1 right-2 bg-red-500 text-white text-xs rounded-full min-w-[1.25rem] h-5 flex items-center justify-center font-bold px-1 animate-pulse">
                {sessionInviteCount > 9 ? '9+' : sessionInviteCount}
              </span>
              <span className="absolute top-1 right-2 bg-red-400 rounded-full min-w-[1.25rem] h-5 animate-ping opacity-75"></span>
            </>
          )}
        </button>
        <button
          onClick={onShowScheduler}
          className="flex flex-col items-center justify-center min-w-[4.5rem] h-full text-amber-500 active:bg-amber-500/20 transition-colors"
        >
          <span className="text-xl">📅</span>
          <span className="text-xs mt-0.5">Schedule</span>
        </button>
        <button
          onClick={onShowHistory}
          className="flex flex-col items-center justify-center min-w-[4.5rem] h-full text-pink-500 active:bg-pink-500/20 transition-colors"
        >
          <span className="text-xl">📜</span>
          <span className="text-xs mt-0.5">History</span>
        </button>
        <button
          onClick={onShowRecs}
          className="flex flex-col items-center justify-center min-w-[4.5rem] h-full text-orange-500 active:bg-orange-500/20 transition-colors"
        >
          <span className="text-xl">💡</span>
          <span className="text-xs mt-0.5">AI Recs</span>
        </button>
        <button
          onClick={onShowCollections}
          className="flex flex-col items-center justify-center min-w-[4.5rem] h-full text-cyan-500 active:bg-cyan-500/20 transition-colors"
        >
          <span className="text-xl">📚</span>
          <span className="text-xs mt-0.5">Collections</span>
        </button>
        <button
          onClick={onShowShare}
          className="flex flex-col items-center justify-center min-w-[4.5rem] h-full text-teal-500 active:bg-teal-500/20 transition-colors"
        >
          <span className="text-xl">🔗</span>
          <span className="text-xs mt-0.5">Share</span>
        </button>
        {isAdmin && (
          <button
            onClick={onShowStats}
            className="flex flex-col items-center justify-center min-w-[4.5rem] h-full text-indigo-500 active:bg-indigo-500/20 transition-colors"
          >
            <span className="text-xl">📊</span>
            <span className="text-xs mt-0.5">Stats</span>
          </button>
        )}
      </div>
    </nav>
  )
}
