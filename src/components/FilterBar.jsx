import { GENRES, MOODS, STREAMING, SORT_OPTIONS } from '../utils/constants'
import TooltipHint from './TooltipHint'

export default function FilterBar({
  filters,
  onFilterChange,
  darkMode,
  users = [],
  showHints = true
}) {
  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const border = darkMode ? 'border-gray-700' : 'border-gray-300'

  const input = darkMode ? 'bg-gray-700' : 'bg-gray-100'

  return (
    <div className="flex flex-wrap gap-2 mb-4 items-center">
      {showHints && (
        <TooltipHint
          text="Use these filters to narrow down your movie list by genre, mood, streaming service, and more!"
          darkMode={darkMode}
          position="bottom"
        />
      )}
      <div className="relative">
        <input
          type="text"
          placeholder="Search movies..."
          value={filters.search || ''}
          onChange={(e) => onFilterChange('search', e.target.value)}
          className={`px-3 py-1 pl-8 rounded text-sm ${input} ${border} border w-40`}
        />
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
      </div>

      <select
        value={filters.genre}
        onChange={(e) => onFilterChange('genre', e.target.value)}
        className={`px-2 py-1 rounded text-sm ${card} ${border} border`}
      >
        <option value="">Genre</option>
        {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
      </select>

      <select
        value={filters.mood}
        onChange={(e) => onFilterChange('mood', e.target.value)}
        className={`px-2 py-1 rounded text-sm ${card} ${border} border`}
      >
        <option value="">Mood</option>
        {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
      </select>

      <select
        value={filters.streaming}
        onChange={(e) => onFilterChange('streaming', e.target.value)}
        className={`px-2 py-1 rounded text-sm ${card} ${border} border`}
      >
        <option value="">Streaming</option>
        {STREAMING.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      {users.length > 0 && (
        <select
          value={filters.addedBy || ''}
          onChange={(e) => onFilterChange('addedBy', e.target.value)}
          className={`px-2 py-1 rounded text-sm ${card} ${border} border`}
        >
          <option value="">Added by</option>
          {users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
        </select>
      )}

      <select
        value={filters.watched}
        onChange={(e) => onFilterChange('watched', e.target.value)}
        className={`px-2 py-1 rounded text-sm ${card} ${border} border`}
      >
        <option value="all">All</option>
        <option value="watched">Watched</option>
        <option value="unwatched">Unwatched</option>
      </select>

      <button
        onClick={() => onFilterChange('favorites', !filters.favorites)}
        className={`px-2 py-1 rounded text-sm border ${
          filters.favorites
            ? 'bg-yellow-600 border-yellow-600'
            : `${card} ${border}`
        }`}
      >
        ❤️
      </button>

      <select
        value={filters.sortBy}
        onChange={(e) => onFilterChange('sortBy', e.target.value)}
        className={`px-2 py-1 rounded text-sm ${card} ${border} border`}
      >
        {SORT_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
