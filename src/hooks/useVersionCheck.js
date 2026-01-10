import { useState, useEffect, useCallback } from 'react'
import { getLatestVersion } from '../lib/database'

export function useVersionCheck() {
  const [isOutdated, setIsOutdated] = useState(false)
  const [latestVersion, setLatestVersion] = useState(null)
  const [dismissed, setDismissed] = useState(false)

  const currentVersion = __APP_VERSION__

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const latest = await getLatestVersion()
        if (latest) {
          setLatestVersion(latest)
          // Compare versions - if different and not dismissed, show banner
          if (latest !== currentVersion) {
            setIsOutdated(true)
          }
        }
      } catch (error) {
        console.error('Failed to check version:', error)
      }
    }

    checkVersion()

    // Check periodically (every 30 minutes)
    const interval = setInterval(checkVersion, 30 * 60 * 1000)

    return () => clearInterval(interval)
  }, [currentVersion])

  const dismissUpdate = useCallback(() => {
    setDismissed(true)
  }, [])

  const refreshApp = useCallback(() => {
    window.location.reload()
  }, [])

  return {
    isOutdated: isOutdated && !dismissed,
    currentVersion,
    latestVersion,
    dismissUpdate,
    refreshApp
  }
}
