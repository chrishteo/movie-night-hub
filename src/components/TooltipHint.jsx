import { useState, useRef, useEffect } from 'react'

export default function TooltipHint({ text, darkMode, position = 'top' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef(null)
  const tooltipRef = useRef(null)

  useEffect(() => {
    if (isOpen && buttonRef.current && tooltipRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const padding = 8

      let top, left

      switch (position) {
        case 'bottom':
          top = buttonRect.bottom + padding
          left = buttonRect.left + buttonRect.width / 2 - tooltipRect.width / 2
          break
        case 'left':
          top = buttonRect.top + buttonRect.height / 2 - tooltipRect.height / 2
          left = buttonRect.left - tooltipRect.width - padding
          break
        case 'right':
          top = buttonRect.top + buttonRect.height / 2 - tooltipRect.height / 2
          left = buttonRect.right + padding
          break
        case 'top':
        default:
          top = buttonRect.top - tooltipRect.height - padding
          left = buttonRect.left + buttonRect.width / 2 - tooltipRect.width / 2
          break
      }

      // Keep within viewport
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      if (left < padding) left = padding
      if (left + tooltipRect.width > viewportWidth - padding) {
        left = viewportWidth - tooltipRect.width - padding
      }
      if (top < padding) {
        // Flip to bottom
        top = buttonRect.bottom + padding
      }
      if (top + tooltipRect.height > viewportHeight - padding) {
        // Flip to top
        top = buttonRect.top - tooltipRect.height - padding
      }

      setTooltipPosition({ top, left })
    }
  }, [isOpen, position])

  // Close on escape or click outside
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    const handleClickOutside = (e) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target)
      ) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('click', handleClickOutside, true)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('click', handleClickOutside, true)
    }
  }, [isOpen])

  const card = darkMode ? 'bg-gray-700' : 'bg-gray-800'

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold transition-colors ${
          darkMode
            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
        }`}
        aria-label="Help"
      >
        ?
      </button>

      {isOpen && (
        <div
          ref={tooltipRef}
          className={`fixed z-50 ${card} text-white text-sm rounded-lg shadow-xl p-3 max-w-xs`}
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left
          }}
        >
          {text}
          {/* Arrow */}
          <div
            className={`absolute w-2 h-2 ${card} transform rotate-45 ${
              position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' :
              position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' :
              position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' :
              'left-[-4px] top-1/2 -translate-y-1/2'
            }`}
          />
        </div>
      )}
    </>
  )
}
