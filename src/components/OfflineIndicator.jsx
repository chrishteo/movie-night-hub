import { useState, useEffect } from 'react'

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      setShowReconnected(true)
      setTimeout(() => setShowReconnected(false), 3000)
    }

    const handleOffline = () => {
      setIsOffline(true)
      setShowReconnected(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOffline && !showReconnected) return null

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium transition-all ${
      isOffline
        ? 'bg-red-600 text-white'
        : 'bg-green-600 text-white'
    }`}>
      {isOffline ? (
        <span>📡 You're offline - Some features may be limited</span>
      ) : (
        <span>✓ Back online!</span>
      )}
    </div>
  )
}
