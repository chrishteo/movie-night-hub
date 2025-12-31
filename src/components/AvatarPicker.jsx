import { useState } from 'react'

const AVATARS = [
  '😊', '😎', '🤓', '🥳', '😴', '🤩',
  '🦊', '🐱', '🦁', '🐼', '🐨', '🦄',
  '🐸', '🐵', '🐶', '🐯', '🦉', '🐲',
  '🎃', '👻', '🤖', '👽', '🎅', '🧙',
  '👑', '🌟', '🔥', '💜', '🎬', '🍿'
]

export default function AvatarPicker({ value, onChange, darkMode }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 text-2xl rounded-full border-2 flex items-center justify-center ${
          darkMode
            ? 'border-gray-600 hover:border-purple-500 bg-gray-700'
            : 'border-gray-300 hover:border-purple-500 bg-gray-100'
        } transition-colors`}
      >
        {value || '😊'}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className={`absolute top-14 left-0 z-20 p-2 rounded-lg shadow-xl grid grid-cols-6 gap-1 ${
            darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            {AVATARS.map(avatar => (
              <button
                key={avatar}
                type="button"
                onClick={() => {
                  onChange(avatar)
                  setIsOpen(false)
                }}
                className={`w-9 h-9 text-xl rounded hover:bg-purple-500/20 transition-colors ${
                  value === avatar ? 'bg-purple-500/30 ring-2 ring-purple-500' : ''
                }`}
              >
                {avatar}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function Avatar({ avatar, size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-lg',
    lg: 'w-10 h-10 text-xl',
    xl: 'w-12 h-12 text-2xl'
  }

  return (
    <span className={`inline-flex items-center justify-center rounded-full bg-gray-700/50 ${sizes[size]} ${className}`}>
      {avatar || '😊'}
    </span>
  )
}
