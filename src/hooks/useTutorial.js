import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'movienight-tutorial-completed'
const HINTS_KEY = 'movienight-hints-enabled'
const WELCOME_KEY = 'movienight-welcome-seen'

export function useTutorial() {
  const [hasSeenTutorial, setHasSeenTutorial] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  const [hasSeenWelcome, setHasSeenWelcome] = useState(() => {
    try {
      return localStorage.getItem(WELCOME_KEY) === 'true'
    } catch {
      return false
    }
  })

  const [showTour, setShowTour] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [showGuidebook, setShowGuidebook] = useState(false)

  const [hintsEnabled, setHintsEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem(HINTS_KEY)
      // Default to true if not set
      return stored === null ? true : stored === 'true'
    } catch {
      return true
    }
  })

  // Auto-show welcome modal for first-time users (instead of tour directly)
  useEffect(() => {
    if (!hasSeenWelcome) {
      // Small delay to let the app render first
      const timer = setTimeout(() => {
        setShowWelcome(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [hasSeenWelcome])

  // Persist hints preference
  useEffect(() => {
    try {
      localStorage.setItem(HINTS_KEY, String(hintsEnabled))
    } catch {
      // Ignore storage errors
    }
  }, [hintsEnabled])

  // Complete the welcome modal and optionally start tour
  const completeWelcome = useCallback((startTourAfter = false) => {
    setHasSeenWelcome(true)
    setShowWelcome(false)
    try {
      localStorage.setItem(WELCOME_KEY, 'true')
    } catch {
      // Ignore storage errors
    }

    if (startTourAfter) {
      // Small delay for smooth transition
      setTimeout(() => {
        setShowTour(true)
      }, 300)
    } else {
      // If skipping tour, also mark tutorial as complete
      setHasSeenTutorial(true)
      try {
        localStorage.setItem(STORAGE_KEY, 'true')
      } catch {
        // Ignore storage errors
      }
    }
  }, [])

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
    setHasSeenWelcome(false)
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(WELCOME_KEY)
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

  const openGuidebook = useCallback(() => {
    setShowGuidebook(true)
  }, [])

  const closeGuidebook = useCallback(() => {
    setShowGuidebook(false)
  }, [])

  return {
    hasSeenTutorial,
    hasSeenWelcome,
    showTour,
    showWelcome,
    showGuidebook,
    setShowTour,
    hintsEnabled,
    setHintsEnabled,
    completeTutorial,
    completeWelcome,
    resetTutorial,
    startTour,
    skipTour,
    openGuidebook,
    closeGuidebook
  }
}
