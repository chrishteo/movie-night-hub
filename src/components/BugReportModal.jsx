import { useState } from 'react'

export default function BugReportModal({
  onClose,
  onSubmit,
  darkMode
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const input = darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!title.trim() || !description.trim()) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      await onSubmit(title.trim(), description.trim())
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to submit bug report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 modal-backdrop">
      <div className={`${card} rounded-lg p-6 w-full max-w-md modal-content`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Report a Bug</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-500/20 rounded-full transition-colors"
          >
            X
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the issue"
              className={`w-full px-3 py-2 rounded border ${input}`}
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe the bug in detail. What were you trying to do? What happened instead?"
              rows={5}
              className={`w-full px-3 py-2 rounded border ${input}`}
              maxLength={1000}
            />
            <div className="text-xs text-gray-500 text-right mt-1">
              {description.length}/1000
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Thank you for helping us improve Movie Night Hub!
        </p>
      </div>
    </div>
  )
}
