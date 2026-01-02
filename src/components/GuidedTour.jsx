import { useState, useEffect, useCallback } from 'react'

const TOUR_STEPS = [
  {
    target: null,
    title: 'Welcome to Movie Night Hub!',
    description: 'Your personal movie watchlist for planning the perfect movie night with friends and family. Let us show you around!',
    icon: '🎬'
  },
  {
    target: '[data-tour="add-movie"]',
    title: 'Add Movies',
    description: 'Click here to search and add movies to your watchlist. You can search by title and we\'ll fetch all the details automatically.',
    position: 'bottom',
    mobileTarget: '[data-tour="add-movie-mobile"]',
    mobilePosition: 'top',
    icon: '➕'
  },
  {
    target: '[data-tour="movie-card"]',
    title: 'Your Movies',
    description: 'Each movie card shows the poster, title, and quick actions. Click to see details, mark as watched, add to favorites, or delete.',
    position: 'bottom',
    icon: '🎥'
  },
  {
    target: '[data-tour="filters"]',
    title: 'Filter & Search',
    description: 'Use filters to find movies by genre, mood, streaming service, or who added them. Great for narrowing down choices!',
    position: 'bottom',
    mobileTarget: '[data-tour="filters-mobile"]',
    mobileDescription: 'Tap here to open filters. Find movies by genre, mood, streaming service, or who added them!',
    icon: '🔍'
  },
  {
    target: '[data-tour="spin-wheel"]',
    title: 'Spin the Wheel',
    description: 'Can\'t decide what to watch? Spin the wheel to randomly pick a movie from your list. Let fate decide!',
    position: 'bottom',
    mobileTarget: '[data-tour="spin-wheel-mobile"]',
    mobilePosition: 'top',
    icon: '🎡'
  },
  {
    target: '[data-tour="voting"]',
    title: 'Vote Together',
    description: 'Start a voting session to democratically choose a movie. Everyone gets to vote and the winner is revealed!',
    position: 'bottom',
    mobileTarget: '[data-tour="voting-mobile"]',
    mobilePosition: 'top',
    icon: '🗳️'
  },
  {
    target: null,
    title: 'You\'re All Set!',
    description: 'That\'s the basics! Look for the ? icons around the app for more tips. Enjoy your movie nights!',
    icon: '🎉'
  }
]

export default function GuidedTour({ onComplete, onSkip, darkMode }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  const step = TOUR_STEPS[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === TOUR_STEPS.length - 1

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Find and highlight target element
  useEffect(() => {
    const targetSelector = isMobile && step.mobileTarget ? step.mobileTarget : step.target

    if (!targetSelector) {
      setTargetRect(null)
      return
    }

    const findTarget = () => {
      const element = document.querySelector(targetSelector)
      if (element) {
        const rect = element.getBoundingClientRect()
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        })
      } else {
        setTargetRect(null)
      }
    }

    findTarget()
    // Re-calculate on scroll/resize
    window.addEventListener('scroll', findTarget, true)
    window.addEventListener('resize', findTarget)

    return () => {
      window.removeEventListener('scroll', findTarget, true)
      window.removeEventListener('resize', findTarget)
    }
  }, [currentStep, step.target, step.mobileTarget, isMobile])

  const handleNext = useCallback(() => {
    if (isLastStep) {
      onComplete()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }, [isLastStep, onComplete])

  const handleBack = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1)
    }
  }, [isFirstStep])

  const handleSkip = useCallback(() => {
    onSkip()
  }, [onSkip])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleSkip()
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        handleBack()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNext, handleBack, handleSkip])

  // Calculate tooltip position
  const getTooltipStyle = () => {
    if (!targetRect) {
      // Center the modal for welcome/done steps
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }
    }

    const padding = 16
    const tooltipHeight = 200
    const tooltipWidth = Math.min(320, window.innerWidth - 32)

    let top, left

    // Position based on step preference, use mobilePosition when on mobile
    const position = (isMobile && step.mobilePosition) ? step.mobilePosition : (step.position || 'bottom')

    if (position === 'bottom') {
      top = targetRect.top + targetRect.height + padding
      // If tooltip would go off bottom, flip to top
      if (top + tooltipHeight > window.innerHeight - padding) {
        top = targetRect.top - tooltipHeight - padding
      }
    } else {
      top = targetRect.top - tooltipHeight - padding
      if (top < padding) {
        top = targetRect.top + targetRect.height + padding
      }
    }

    // Center horizontally relative to target
    left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2
    // Keep within viewport
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding))

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`
    }
  }

  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const textColor = darkMode ? 'text-white' : 'text-gray-900'

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 transition-opacity"
        onClick={handleSkip}
      />

      {/* Spotlight effect */}
      {targetRect && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
            borderRadius: '12px',
            border: '2px solid rgba(168, 85, 247, 0.8)',
            backgroundColor: 'transparent'
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className={`${card} ${textColor} rounded-xl shadow-2xl p-5 z-10`}
        style={getTooltipStyle()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{step.icon}</span>
            <span className="text-xs text-gray-400">
              {currentStep + 1} / {TOUR_STEPS.length}
            </span>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-300 text-sm"
          >
            Skip
          </button>
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold mb-2">{step.title}</h3>
        <p className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {(isMobile && step.mobileDescription) ? step.mobileDescription : step.description}
        </p>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-4">
          {TOUR_STEPS.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep
                  ? 'bg-purple-500'
                  : index < currentStep
                  ? 'bg-purple-500/50'
                  : darkMode ? 'bg-gray-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-2">
          {!isFirstStep && (
            <button
              onClick={handleBack}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white"
          >
            {isLastStep ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
