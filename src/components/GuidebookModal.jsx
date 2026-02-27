import { useState } from 'react'

const TABS = [
  { id: 'buttons', label: 'Buttons', icon: '🔘' },
  { id: 'filters', label: 'Filters', icon: '🔍' },
  { id: 'features', label: 'Features', icon: '✨' }
]

const BUTTON_GUIDE = [
  { icon: '➕', name: 'Add', description: 'Search and add movies to your watchlist. We auto-fetch poster, ratings, and details.' },
  { icon: '📥', name: 'Import', description: 'Import movies from your IMDB watchlist by uploading a CSV export.' },
  { icon: '🎡', name: 'Spin', description: 'Randomly pick a movie when you can\'t decide. Select participants and let fate choose!' },
  { icon: '🗳️', name: 'Vote', description: 'Create voting sessions where everyone picks favorites. The winner gets revealed!' },
  { icon: '💡', name: 'AI Recs', description: 'Get AI-powered movie recommendations based on your watchlist and preferences.' },
  { icon: '📜', name: 'History', description: 'View your complete watch history with dates and timeline.' },
  { icon: '🔗', name: 'Share', description: 'Share your movie list with friends via a link or export it.' },
  { icon: '🔥', name: 'Trending', description: 'Browse currently trending movies and add them directly to your list.' },
  { icon: '📚', name: 'Collections', description: 'Create themed collections and share them with others.' },
  { icon: '📅', name: 'Schedule', description: 'Plan movie nights with a calendar. Set dates, times, and invite friends.' },
  { icon: '📩', name: 'Invites', description: 'View and manage movie recommendations sent by friends.' },
  { icon: '☑️', name: 'Select', description: 'Enable bulk selection to mark multiple movies as watched or delete them.' },
  { icon: '🆕', name: 'NEW', description: 'Review movies added by others. Shows a count badge when there are new movies to review.' },
  { icon: '👥', name: 'Friends', description: 'Manage your friends list. Send and accept friend requests to see each other\'s movies.' }
]

const FILTER_GUIDE = [
  { name: 'All / Mine', description: 'Toggle between viewing everyone\'s movies or just the ones you added.' },
  { name: 'Genre', description: 'Filter by genre: Action, Comedy, Drama, Horror, Sci-Fi, Romance, and more.' },
  { name: 'Mood', description: 'Filter by mood: Feel-Good, Intense, Thought-Provoking, Romantic, Scary, etc.' },
  { name: 'Streaming', description: 'Find movies on specific platforms: Netflix, Disney+, HBO Max, Prime Video, etc.' },
  { name: 'Watched Status', description: 'Show all movies, only unwatched, or only watched ones.' },
  { name: 'Added By', description: 'Filter to see movies added by a specific person.' },
  { name: 'Sort Options', description: 'Sort by date added, title, rating, or release year.' },
  { name: 'Grid / List', description: 'Toggle between grid view (posters) and list view (detailed rows).' }
]

const FEATURE_GUIDE = [
  {
    name: 'New Movies Review',
    icon: '🆕',
    description: 'When others add movies, you\'ll see a NEW badge. Review each movie with three options: "Already Watched" (skip it), "Not Interested" (exclude from spin/vote), or "Add to Watchlist" (include in your rotation).'
  },
  {
    name: 'Collections',
    icon: '📚',
    description: 'Create themed collections like "Halloween Movies" or "Date Night". Share collections with friends so they can see and add from your curated lists.'
  },
  {
    name: 'Movie Night Scheduler',
    icon: '📅',
    description: 'Schedule movie nights on a calendar. Pick a movie, set a date and time, add notes, and optionally sync with Google Calendar.'
  },
  {
    name: 'Voting Sessions',
    icon: '🗳️',
    description: 'Start a voting session with friends. Everyone selects their top picks from a shared pool, and the winner is revealed with a celebration!'
  },
  {
    name: 'Watch Invites',
    icon: '📩',
    description: 'Recommend movies to friends. When they accept, it\'s added to their list automatically. Great for sharing discoveries!'
  },
  {
    name: 'Per-User Tracking',
    icon: '👁️',
    description: 'Everyone tracks their own watched status and ratings independently. See what others have rated and compare opinions.'
  },
  {
    name: 'Movie Details',
    icon: '🎬',
    description: 'Click any movie to see full details: cast, runtime, ratings, streaming availability, and "More Like This" recommendations.'
  },
  {
    name: 'Spin Wheel',
    icon: '🎡',
    description: 'Can\'t decide? Add participants and spin the wheel. It picks randomly from everyone\'s unwatched movies. Schedule directly from the result!'
  },
  {
    name: 'AI Recommendations',
    icon: '💡',
    description: 'Get personalized suggestions based on your watchlist patterns, favorite genres, and viewing history.'
  },
  {
    name: 'Friends System',
    icon: '👥',
    description: 'Connect with friends to share movies. Send friend requests, and once accepted, you\'ll see each other\'s movies in all tabs. Only movies from friends appear in your list, spin wheel, and voting sessions.'
  }
]

export default function GuidebookModal({
  onClose,
  darkMode
}) {
  const [activeTab, setActiveTab] = useState('buttons')

  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const cardBg = darkMode ? 'bg-gray-700/50' : 'bg-gray-100'
  const textMuted = darkMode ? 'text-gray-400' : 'text-gray-600'
  const border = darkMode ? 'border-gray-700' : 'border-gray-300'

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 modal-backdrop modal-safe-area"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`${card} rounded-lg w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col modal-content`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${border}`}>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span>📖</span> Guidebook
          </h2>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              darkMode
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
            }`}
            title="Close (Esc)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex gap-1 p-3 border-b ${border} overflow-x-auto`}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Buttons Tab */}
          {activeTab === 'buttons' && (
            <div className="space-y-3">
              <p className={`text-sm ${textMuted} mb-4`}>
                Quick reference for all the action buttons in the app.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {BUTTON_GUIDE.map((item, index) => (
                  <div key={index} className={`${cardBg} rounded-lg p-3`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{item.icon}</span>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <p className={`text-sm ${textMuted}`}>{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters Tab */}
          {activeTab === 'filters' && (
            <div className="space-y-3">
              <p className={`text-sm ${textMuted} mb-4`}>
                Use filters to find exactly the movie you're looking for.
              </p>
              <div className="space-y-3">
                {FILTER_GUIDE.map((item, index) => (
                  <div key={index} className={`${cardBg} rounded-lg p-3`}>
                    <p className="font-medium mb-1">{item.name}</p>
                    <p className={`text-sm ${textMuted}`}>{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features Tab */}
          {activeTab === 'features' && (
            <div className="space-y-3">
              <p className={`text-sm ${textMuted} mb-4`}>
                Explore all the features that make movie nights more fun.
              </p>
              <div className="space-y-3">
                {FEATURE_GUIDE.map((item, index) => (
                  <div key={index} className={`${cardBg} rounded-lg p-4`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-bold">{item.name}</span>
                    </div>
                    <p className={`text-sm ${textMuted}`}>{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${border} text-center`}>
          <p className={`text-xs ${textMuted}`}>
            Tip: You can restart the guided tour anytime from your profile menu
          </p>
        </div>
      </div>
    </div>
  )
}
