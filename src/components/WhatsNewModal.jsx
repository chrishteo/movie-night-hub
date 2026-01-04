import { useEffect } from 'react'
import { formatDate } from '../utils/helpers'

const TYPE_CONFIG = {
  feature: { label: 'New Feature', color: 'bg-green-500', emoji: '✨' },
  fix: { label: 'Bug Fix', color: 'bg-red-500', emoji: '🐛' },
  improvement: { label: 'Improvement', color: 'bg-blue-500', emoji: '💡' }
}

export default function WhatsNewModal({
  onClose,
  changelog,
  onFetchChangelog,
  darkMode
}) {
  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const border = darkMode ? 'border-gray-700' : 'border-gray-300'

  useEffect(() => {
    onFetchChangelog()
  }, [onFetchChangelog])

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 modal-backdrop modal-safe-area"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`${card} rounded-lg w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col modal-content`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${border}`}>
          <h2 className="text-xl font-bold flex items-center gap-2">
            🎉 What's New
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-500/20 rounded-full transition-colors"
          >
            X
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {changelog.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No updates yet. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {changelog.map(entry => {
                const config = TYPE_CONFIG[entry.type] || TYPE_CONFIG.feature
                return (
                  <div
                    key={entry.id}
                    className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{config.emoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`px-2 py-0.5 text-xs rounded text-white ${config.color}`}>
                            {config.label}
                          </span>
                          {entry.version && (
                            <span className="px-2 py-0.5 text-xs rounded bg-gray-500 text-white">
                              v{entry.version}
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium">{entry.title}</h3>
                        <p className="text-sm text-gray-400 mt-1">{entry.description}</p>
                        <div className="text-xs text-gray-500 mt-2">
                          {formatDate(entry.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
