import { useState, useEffect, useCallback } from 'react'
import { registerSW } from 'virtual:pwa-register'

export function useServiceWorker() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)
  const [updateSW, setUpdateSW] = useState(null)

  useEffect(() => {
    const update = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true)
      },
      onOfflineReady() {
        setOfflineReady(true)
      },
      onRegisteredSW(swUrl, registration) {
        // Check for updates periodically (every 60 minutes)
        if (registration) {
          setInterval(() => {
            registration.update()
          }, 60 * 60 * 1000)
        }
      }
    })

    setUpdateSW(() => update)
  }, [])

  const updateApp = useCallback(() => {
    if (updateSW) {
      updateSW(true)
    }
  }, [updateSW])

  const dismissUpdate = useCallback(() => {
    setNeedRefresh(false)
  }, [])

  const dismissOfflineReady = useCallback(() => {
    setOfflineReady(false)
  }, [])

  return {
    needRefresh,
    offlineReady,
    updateApp,
    dismissUpdate,
    dismissOfflineReady
  }
}
