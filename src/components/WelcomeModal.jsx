export default function WelcomeModal({
  onStartTour,
  onSkip,
  darkMode
}) {
  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const textMuted = darkMode ? 'text-gray-400' : 'text-gray-600'

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60] modal-backdrop modal-safe-area"
      onClick={(e) => e.target === e.currentTarget && onSkip()}
    >
      <div className={`${card} rounded-2xl p-6 w-full max-w-md modal-content text-center`}>
        {/* Logo/Icon */}
        <div className="text-6xl mb-4">
          <span role="img" aria-label="Movie">🎬</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-2">
          Welcome to Movie Night Hub!
        </h1>

        {/* Subtitle */}
        <p className={`${textMuted} mb-6`}>
          Your personal movie watchlist for planning the perfect movie night
        </p>

        {/* Feature bullets */}
        <div className="text-left space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">📋</span>
            <div>
              <p className="font-medium">Track Movies Together</p>
              <p className={`text-sm ${textMuted}`}>
                Build a shared watchlist with friends and family
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">🎡</span>
            <div>
              <p className="font-medium">Spin the Wheel</p>
              <p className={`text-sm ${textMuted}`}>
                Can't decide? Let fate choose your next movie
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">🗳️</span>
            <div>
              <p className="font-medium">Vote Together</p>
              <p className={`text-sm ${textMuted}`}>
                Create voting sessions for group decisions
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">📚</span>
            <div>
              <p className="font-medium">Organize Collections</p>
              <p className={`text-sm ${textMuted}`}>
                Group movies by theme, mood, or occasion
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <button
            onClick={onStartTour}
            className="w-full px-4 py-3 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white transition-colors"
          >
            Take the Tour
          </button>
          <button
            onClick={onSkip}
            className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            Skip for Now
          </button>
        </div>

        {/* Footer hint */}
        <p className={`text-xs ${textMuted} mt-4`}>
          You can always restart the tour from your profile menu
        </p>
      </div>
    </div>
  )
}
