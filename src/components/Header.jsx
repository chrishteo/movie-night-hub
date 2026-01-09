import { useState, useRef, useEffect } from 'react'
import { Avatar } from './AvatarPicker'
import AvatarPicker from './AvatarPicker'

export default function Header({
  users,
  currentUser,
  onUserChange,
  onUpdateUser,
  onSignOut,
  authEmail,
  authUserId,
  darkMode,
  onToggleDarkMode,
  isAdmin,
  onOpenAdmin,
  onOpenBugReport,
  onOpenMyBugReports,
  onStartTutorial,
  onOpenWhatsNew
}) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [editingAvatar, setEditingAvatar] = useState(false)
  const [dropdownAlign, setDropdownAlign] = useState('right')
  const buttonRef = useRef(null)
  const currentUserObj = users.find(u => u.name === currentUser)

  // Calculate dropdown alignment based on button position
  useEffect(() => {
    if (showUserMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const dropdownWidth = 180
      const viewportWidth = window.innerWidth

      // Check if dropdown would overflow on the right when left-aligned
      const wouldOverflowRight = rect.left + dropdownWidth > viewportWidth - 16
      // Check if dropdown would overflow on the left when right-aligned
      const wouldOverflowLeft = rect.right - dropdownWidth < 16

      if (wouldOverflowRight && !wouldOverflowLeft) {
        setDropdownAlign('right')
      } else if (wouldOverflowLeft && !wouldOverflowRight) {
        setDropdownAlign('left')
      } else {
        // Default to right-aligned (dropdown extends left from button)
        setDropdownAlign('right')
      }
    }
  }, [showUserMenu])

  // Only show profiles linked to the current auth user
  const myProfiles = authUserId
    ? users.filter(u => u.auth_id === authUserId)
    : users

  const handleAvatarChange = async (newAvatar) => {
    if (currentUserObj && onUpdateUser) {
      await onUpdateUser(currentUserObj.id, { avatar: newAvatar })
    }
    setEditingAvatar(false)
  }

  return (
    <header className="flex flex-wrap items-center justify-between mb-4 gap-3">
      <h1 className="text-xl font-bold">🎬 Movie Night Hub</h1>
      <div className="flex items-center gap-2 flex-wrap">
        {/* User selector with avatar */}
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`flex items-center gap-2 px-2 py-1 rounded border ${
              darkMode
                ? 'bg-gray-800 border-gray-700 hover:border-purple-500'
                : 'bg-white border-gray-300 hover:border-purple-500'
            } transition-colors`}
          >
            <Avatar avatar={currentUserObj?.avatar} size="sm" />
            <span className="text-sm">{currentUser}</span>
            <span className="text-xs opacity-50">▼</span>
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />
              <div className={`absolute top-10 z-20 rounded-lg shadow-xl min-w-[180px] ${
                dropdownAlign === 'right' ? 'right-0' : 'left-0'
              } ${
                darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}>
                {/* User list - only show profiles linked to current auth user */}
                {myProfiles.length > 1 && (
                  <div className="p-1 border-b border-gray-700">
                    {myProfiles.map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onUserChange(u.name)
                          setShowUserMenu(false)
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded text-left text-sm hover:bg-purple-500/20 ${
                          u.name === currentUser ? 'bg-purple-500/10' : ''
                        }`}
                      >
                        <Avatar avatar={u.avatar} size="sm" />
                        <span>{u.name}</span>
                        {u.name === currentUser && <span className="ml-auto text-purple-400">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
                {/* Actions */}
                <div className="p-1">
                  <button
                    onClick={() => {
                      setEditingAvatar(true)
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded text-left text-sm hover:bg-purple-500/20"
                  >
                    <span>🎨</span>
                    <span>Change Avatar</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenBugReport?.()
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded text-left text-sm hover:bg-purple-500/20"
                  >
                    <span>🐛</span>
                    <span>Report Bug</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenMyBugReports?.()
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded text-left text-sm hover:bg-purple-500/20"
                  >
                    <span>📋</span>
                    <span>My Bug Reports</span>
                  </button>
                  <button
                    onClick={() => {
                      onStartTutorial?.()
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded text-left text-sm hover:bg-purple-500/20"
                  >
                    <span>📖</span>
                    <span>View Tutorial</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenWhatsNew?.()
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded text-left text-sm hover:bg-purple-500/20"
                  >
                    <span>🎉</span>
                    <span>What's New</span>
                  </button>
                  {onSignOut && (
                    <>
                      <div className={`my-1 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                      {authEmail && (
                        <div className="px-3 py-1 text-xs opacity-50 truncate">
                          {authEmail}
                        </div>
                      )}
                      <button
                        onClick={() => {
                          onSignOut()
                          setShowUserMenu(false)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded text-left text-sm hover:bg-gray-500/20 text-gray-400"
                      >
                        <span>🚪</span>
                        <span>Sign Out</span>
                      </button>
                    </>
                  )}
                  {/* Version info */}
                  <div className={`px-3 py-2 text-xs opacity-40 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    v{__APP_VERSION__} ({__GIT_HASH__})
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {isAdmin && (
          <button
            onClick={onOpenAdmin}
            className={`px-2 py-1 rounded border ${
              darkMode
                ? 'bg-purple-600 border-purple-500 hover:bg-purple-500'
                : 'bg-purple-500 border-purple-400 hover:bg-purple-400'
            }`}
            title="Admin Panel"
          >
            Admin
          </button>
        )}

        <button
          onClick={onToggleDarkMode}
          className={`px-2 py-1 rounded border ${
            darkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-300'
          }`}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Avatar edit modal */}
      {editingAvatar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 modal-backdrop modal-safe-area">
          <div className={`rounded-lg p-6 w-full max-w-xs modal-content ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className="text-lg font-bold mb-4">Choose Avatar</h3>
            <div className="flex justify-center mb-4">
              <AvatarPicker
                value={currentUserObj?.avatar}
                onChange={handleAvatarChange}
                darkMode={darkMode}
              />
            </div>
            <p className="text-center text-sm opacity-70 mb-4">
              Click the avatar to see options
            </p>
            <button
              onClick={() => setEditingAvatar(false)}
              className="w-full px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
