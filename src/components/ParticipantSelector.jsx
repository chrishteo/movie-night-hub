import { Avatar } from './AvatarPicker'

export default function ParticipantSelector({
  users,
  selectedUsers,
  onToggleUser,
  onSelectAll,
  onSelectNone,
  darkMode,
  label = "Who's participating?",
  showMovieCount = true,
  movies = []
}) {
  const card = darkMode ? 'bg-gray-700' : 'bg-gray-100'
  const border = darkMode ? 'border-gray-600' : 'border-gray-300'

  // Filter out system/admin users that shouldn't participate
  const participantUsers = users.filter(u =>
    u.name.toLowerCase() !== 'admin'
  )

  // Count movies per user
  const getMovieCount = (userName) => {
    return movies.filter(m => m.added_by === userName).length
  }

  // Count unwatched movies per user
  const getUnwatchedCount = (userName) => {
    return movies.filter(m => m.added_by === userName && !m.watched).length
  }

  const totalSelected = selectedUsers.length
  const totalMovies = movies.filter(m => selectedUsers.includes(m.added_by)).length
  const totalUnwatched = movies.filter(m => selectedUsers.includes(m.added_by) && !m.watched).length

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium">{label}</label>
        <div className="flex gap-2 text-xs">
          <button
            onClick={onSelectAll}
            className="text-purple-400 hover:text-purple-300"
          >
            All
          </button>
          <span className="opacity-30">|</span>
          <button
            onClick={onSelectNone}
            className="text-gray-400 hover:text-gray-300"
          >
            None
          </button>
        </div>
      </div>

      <div className={`${card} rounded-lg p-3 border ${border}`}>
        <div className="space-y-2">
          {participantUsers.map(user => {
            const isSelected = selectedUsers.includes(user.name)
            const movieCount = getMovieCount(user.name)
            const unwatchedCount = getUnwatchedCount(user.name)

            return (
              <label
                key={user.id}
                className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-purple-500/20 border border-purple-500/50'
                    : 'hover:bg-gray-600/30 border border-transparent'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleUser(user.name)}
                  className="w-4 h-4 rounded border-gray-500 text-purple-600 focus:ring-purple-500"
                />
                <Avatar avatar={user.avatar} size="sm" />
                <span className="flex-1">{user.name}</span>
                {showMovieCount && (
                  <span className={`text-xs ${isSelected ? 'text-purple-300' : 'opacity-50'}`}>
                    {unwatchedCount} unwatched
                  </span>
                )}
              </label>
            )
          })}
        </div>

        {/* Summary */}
        {showMovieCount && totalSelected > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-600 text-sm text-center">
            <span className="text-purple-400 font-medium">{totalUnwatched}</span>
            <span className="opacity-70"> unwatched movies from </span>
            <span className="text-purple-400 font-medium">{totalSelected}</span>
            <span className="opacity-70"> {totalSelected === 1 ? 'person' : 'people'}</span>
          </div>
        )}
      </div>
    </div>
  )
}
