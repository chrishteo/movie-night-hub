import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'movienight-tutorial-completed'
const HINTS_KEY = 'movienight-hints-enabled'

export function useTutorial() {
  const [hasSeenTutorial, setHasSeenTutorial] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  const [showTour, setShowTour] = useState(false)

  const [hintsEnabled, setHintsEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem(HINTS_KEY)
      // Default to true if not set
      return stored === null ? true : stored === 'true'
    } catch {
      return true
    }
  })

  // Auto-show tour for first-time users
  useEffect(() => {
    if (!hasSeenTutorial) {
      // Small delay to let the app render first
      const timer = setTimeout(() => {
        setShowTour(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [hasSeenTutorial])

  // Persist hints preference
  useEffect(() => {
    try {
      localStorage.setItem(HINTS_KEY, String(hintsEnabled))
    } catch {
      // Ignore storage errors
    }
  }, [hintsEnabled])

  const completeTutorial = useCallback(() => {
    setHasSeenTutorial(true)
    setShowTour(false)
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      // Ignore storage errors
    }
  }, [])

  const resetTutorial = useCallback(() => {
    setHasSeenTutorial(false)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore storage errors
    }
  }, [])

  const startTour = useCallback(() => {
    setShowTour(true)
  }, [])

  const skipTour = useCallback(() => {
    completeTutorial()
  }, [completeTutorial])

  return {
    hasSeenTutorial,
    showTour,
    setShowTour,
    hintsEnabled,
    setHintsEnabled,
    completeTutorial,
    resetTutorial,
    startTour,
    skipTour
  }
}
