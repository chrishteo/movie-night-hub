import { useVersionCheck } from '../hooks/useVersionCheck'
import { useServiceWorker } from '../hooks/useServiceWorker'

export default function UpdateBanner() {
  const { isOutdated, currentVersion, latestVersion, dismissUpdate, refreshApp } = useVersionCheck()
  const { offlineReady, dismissOfflineReady } = useServiceWorker()

  if (isOutdated) {
    return (
      <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-slide-up">
        <div className="bg-purple-600 text-white rounded-lg shadow-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🚀</span>
            <div className="flex-1">
              <p className="font-bold">Update Available!</p>
              <p className="text-sm text-purple-200 mt-1">
                Version {latestVersion} is available (you have {currentVersion}).
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={dismissUpdate}
              className="flex-1 px-3 py-2 rounded bg-purple-700 hover:bg-purple-800 text-sm transition-colors"
            >
              Later
            </button>
            <button
              onClick={refreshApp}
              className="flex-1 px-3 py-2 rounded bg-white text-purple-600 font-medium text-sm hover:bg-purple-50 transition-colors"
            >
              Update Now
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (offlineReady) {
    return (
      <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-slide-up">
        <div className="bg-green-600 text-white rounded-lg shadow-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✓</span>
            <div className="flex-1">
              <p className="font-medium">Ready for offline use!</p>
            </div>
            <button
              onClick={dismissOfflineReady}
              className="p-1 hover:bg-green-700 rounded transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
