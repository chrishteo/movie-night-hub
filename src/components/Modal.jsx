import { useEffect } from 'react'

export default function Modal({
  children,
  onClose,
  title,
  darkMode,
  maxWidth = 'max-w-lg',
  showCloseButton = true
}) {
  const card = darkMode ? 'bg-gray-800' : 'bg-white'

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  // Handle click outside
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40 overflow-auto"
      onClick={handleBackdropClick}
    >
      <div className={`${card} rounded-lg w-full ${maxWidth} max-h-[90vh] overflow-auto relative`}>
        {/* Header with X button */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 pb-2 bg-inherit">
          <h2 className="text-lg font-bold">{title}</h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${
                darkMode
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                  : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
              }`}
              title="Close (Esc)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4 pt-2">
          {children}
        </div>
      </div>
    </div>
  )
}
