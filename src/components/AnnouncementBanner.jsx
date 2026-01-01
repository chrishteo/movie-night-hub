import { useState, useEffect } from 'react'

const TYPE_STYLES = {
  info: {
    bg: 'bg-blue-600',
    icon: 'i'
  },
  warning: {
    bg: 'bg-yellow-600',
    icon: '!'
  },
  update: {
    bg: 'bg-green-600',
    icon: '*'
  },
  maintenance: {
    bg: 'bg-red-600',
    icon: 'M'
  }
}

export default function AnnouncementBanner({ announcements }) {
  const [dismissedIds, setDismissedIds] = useState(() => {
    // Get dismissed IDs from sessionStorage
    try {
      const stored = sessionStorage.getItem('dismissedAnnouncements')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Filter to active announcements that haven't been dismissed
  const activeAnnouncements = announcements.filter(a => {
    if (!a.active) return false
    if (dismissedIds.includes(a.id)) return false
    if (a.expires_at && new Date(a.expires_at) < new Date()) return false
    return true
  })

  // Get the most recent announcement to show
  const currentAnnouncement = activeAnnouncements[0]

  const dismiss = (id) => {
    const newDismissed = [...dismissedIds, id]
    setDismissedIds(newDismissed)
    try {
      sessionStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed))
    } catch {
      // Ignore storage errors
    }
  }

  if (!currentAnnouncement) return null

  const style = TYPE_STYLES[currentAnnouncement.type] || TYPE_STYLES.info

  return (
    <div className={`${style.bg} text-white px-4 py-2 flex items-center justify-between gap-4`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold shrink-0">
          {style.icon}
        </span>
        <div className="min-w-0">
          <span className="font-medium">{currentAnnouncement.title}</span>
          {currentAnnouncement.message && (
            <span className="text-white/80 ml-2 hidden sm:inline">
              - {currentAnnouncement.message}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={() => dismiss(currentAnnouncement.id)}
        className="shrink-0 p-1 hover:bg-white/20 rounded transition-colors"
        aria-label="Dismiss announcement"
      >
        X
      </button>
    </div>
  )
}
