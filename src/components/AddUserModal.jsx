import { useState } from 'react'
import AvatarPicker from './AvatarPicker'

export default function AddUserModal({ onAdd, onClose, darkMode }) {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('😊')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError('')

    try {
      await onAdd(name.trim(), avatar)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to add user')
    } finally {
      setLoading(false)
    }
  }

  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const input = darkMode ? 'bg-gray-700' : 'bg-gray-100'
  const border = darkMode ? 'border-gray-700' : 'border-gray-300'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40 modal-backdrop">
      <div className={`${card} rounded-lg p-6 w-full max-w-sm modal-content`}>
        <h2 className="text-xl font-bold mb-4">Add Person</h2>
        <form onSubmit={handleSubmit}>
          <div className="flex gap-3 items-start mb-4">
            <AvatarPicker
              value={avatar}
              onChange={setAvatar}
              darkMode={darkMode}
            />
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`flex-1 px-3 py-2 rounded ${input} border ${border}`}
              autoFocus
            />
          </div>
          {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="flex-1 px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
            >
              {loading ? '...' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
