export default function Header({
  users,
  currentUser,
  onUserChange,
  onAddUser,
  onDeleteUser,
  darkMode,
  onToggleDarkMode
}) {
  const currentUserObj = users.find(u => u.name === currentUser)

  const handleDeleteUser = () => {
    if (users.length <= 1) {
      alert('Cannot delete the last user!')
      return
    }
    if (confirm(`Delete user "${currentUser}"?`)) {
      onDeleteUser(currentUserObj.id, currentUser)
    }
  }

  return (
    <header className="flex flex-wrap items-center justify-between mb-4 gap-3">
      <h1 className="text-xl font-bold">🎬 Movie Night Hub</h1>
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={currentUser || ''}
          onChange={(e) => onUserChange(e.target.value)}
          className={`px-2 py-1 rounded text-sm border ${
            darkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-300'
          }`}
        >
          {users.map(u => (
            <option key={u.id} value={u.name}>{u.name}</option>
          ))}
        </select>
        <button
          onClick={onAddUser}
          className="text-xs text-purple-400 hover:text-purple-300"
        >
          + Person
        </button>
        <button
          onClick={handleDeleteUser}
          className="text-xs text-red-400 hover:text-red-300"
          title="Delete current user"
        >
          - Person
        </button>
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
    </header>
  )
}
