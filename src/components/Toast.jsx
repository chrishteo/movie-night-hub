import { useState, useEffect, createContext, useContext, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }) {
  const [isExiting, setIsExiting] = useState(false)

  const bgColor = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-yellow-600',
    info: 'bg-blue-600'
  }[toast.type] || 'bg-gray-700'

  const icon = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }[toast.type] || 'ℹ'

  const handleRemove = () => {
    setIsExiting(true)
    setTimeout(() => onRemove(toast.id), 200)
  }

  return (
    <div
      className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 cursor-pointer
        ${isExiting ? 'animate-slide-out' : 'animate-slide-in'}`}
      onClick={handleRemove}
    >
      <span className="text-lg">{icon}</span>
      <p className="flex-1 text-sm">{toast.message}</p>
      <button
        onClick={(e) => { e.stopPropagation(); handleRemove() }}
        className="opacity-70 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  )
}
