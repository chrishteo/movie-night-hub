import { useState, useEffect } from 'react'
import { encodeShareData } from '../utils/helpers'
import Modal from './Modal'

export default function ShareModal({ movies, onClose, darkMode }) {
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const input = darkMode ? 'bg-gray-700' : 'bg-gray-100'
  const border = darkMode ? 'border-gray-700' : 'border-gray-300'

  useEffect(() => {
    const encoded = encodeShareData(movies)
    const url = `${window.location.origin}${window.location.pathname}?list=${encoded}`
    setShareUrl(url)
  }, [movies])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Modal title="🔗 Share List" onClose={onClose} darkMode={darkMode} maxWidth="max-w-md">
      <p className="text-sm mb-3 opacity-70">
        Share this link with friends to let them see your movie collection:
      </p>

      <div className="flex gap-2 mb-4">
        <input
          value={shareUrl}
          readOnly
          className={`flex-1 px-3 py-2 rounded text-xs ${input} border ${border}`}
        />
        <button
          onClick={handleCopy}
          className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white"
        >
          {copied ? '✓' : '📋'}
        </button>
      </div>

      <p className="text-xs opacity-50">
        Note: This link encodes your current movie list. For a
        production app, consider storing shared lists in the database
        with a unique ID.
      </p>
    </Modal>
  )
}
