import { useState, useEffect } from 'react'

export default function InstallPrompt({ darkMode }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return
    }

    // Check if dismissed recently
    const dismissed = localStorage.getItem('pwa-prompt-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed)
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 7) return
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  const card = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'

  return (
    <div className={`fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 ${card} border rounded-lg p-4 shadow-xl z-40`}>
      <div className="flex items-start gap-3">
        <span className="text-3xl">📱</span>
        <div className="flex-1">
          <h3 className="font-bold mb-1">Install App</h3>
          <p className="text-sm opacity-70 mb-3">
            Add Movie Night Hub to your home screen for quick access!
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded text-sm bg-gray-600 hover:bg-gray-500"
            >
              Later
            </button>
            <button
              onClick={handleInstall}
              className="px-3 py-1.5 rounded text-sm bg-purple-600 hover:bg-purple-700 text-white"
            >
              Install
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
