import { useState, useEffect } from 'react'
import { Avatar } from './AvatarPicker'
import AvatarPicker from './AvatarPicker'
import ConfirmDialog from './ConfirmDialog'
import { formatDate } from '../utils/helpers'
import { getMovieNights, deleteMovieNight } from '../lib/database'

const SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'movies', label: 'Movies', icon: '🎬' },
  { id: 'events', label: 'Events', icon: '📅' },
  { id: 'sessions', label: 'Sessions', icon: '🗳️' },
  { id: 'collections', label: 'Collections', icon: '📚' },
  { id: 'announcements', label: 'Announce', icon: '📢' },
  { id: 'changelog', label: 'Changelog', icon: '📝' },
  { id: 'bugs', label: 'Bugs', icon: '🐛' }
]

const STATUS_COLORS = {
  open: 'bg-yellow-500',
  in_progress: 'bg-blue-500',
  resolved: 'bg-green-500',
  closed: 'bg-gray-500'
}

const ANNOUNCEMENT_TYPES = [
  { value: 'info', label: 'Info', color: 'bg-blue-500' },
  { value: 'warning', label: 'Warning', color: 'bg-yellow-500' },
  { value: 'update', label: 'Update', color: 'bg-green-500' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-red-500' }
]

const CHANGELOG_TYPES = [
  { value: 'feature', label: 'New Feature', color: 'bg-green-500' },
  { value: 'fix', label: 'Bug Fix', color: 'bg-red-500' },
  { value: 'improvement', label: 'Improvement', color: 'bg-blue-500' }
]

export default function AdminDashboard({
  users,
  movies,
  totalMovies: totalMoviesProp,
  onLoadAllMovies,
  currentUserId,
  authUserId,
  votingSessions = [],
  onDeleteSession,
  onToggleUserAdmin,
  onDeleteUser,
  onDeleteMovie,
  onEditMovie,
  onEditUser,
  collections = [],
  onFetchCollections,
  onDeleteCollection,
  announcements = [],
  onFetchAnnouncements,
  onAddAnnouncement,
  onEditAnnouncement,
  onDeleteAnnouncement,
  bugReports = [],
  onFetchBugReports,
  onEditBugReport,
  onDeleteBugReport,
  changelog = [],
  onFetchChangelog,
  onAddChangelog,
  onEditChangelog,
  onDeleteChangelog,
  onViewAsUser,
  onSignOut,
  addToast
}) {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  // Scheduled events state
  const [scheduledEvents, setScheduledEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(true)

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null })

  // Form states
  const [editingUser, setEditingUser] = useState(null)
  const [userForm, setUserForm] = useState({ name: '', avatar: null })
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)

  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState(null)
  const [announcementForm, setAnnouncementForm] = useState({
    title: '', message: '', type: 'info', expires_at: ''
  })

  const [showChangelogForm, setShowChangelogForm] = useState(false)
  const [editingChangelog, setEditingChangelog] = useState(null)
  const [changelogForm, setChangelogForm] = useState({
    title: '', description: '', type: 'feature', version: ''
  })

  const [selectedBugReport, setSelectedBugReport] = useState(null)
  const [bugReportNotes, setBugReportNotes] = useState('')
  const [bugReportStatus, setBugReportStatus] = useState('open')
  const [statusFilter, setStatusFilter] = useState('all')

  // Fetch data on mount
  useEffect(() => {
    onFetchAnnouncements(false)
    onFetchBugReports()
    onFetchChangelog()
    if (onFetchCollections) onFetchCollections()
    fetchScheduledEvents()
  }, [])

  const fetchScheduledEvents = async () => {
    try {
      setEventsLoading(true)
      const data = await getMovieNights()
      setScheduledEvents(data || [])
    } catch (err) {
      console.error('Error fetching events:', err)
    } finally {
      setEventsLoading(false)
    }
  }

  // Load all movies when viewing Movies section
  useEffect(() => {
    if (activeSection === 'movies' && onLoadAllMovies) {
      onLoadAllMovies()
    }
  }, [activeSection, onLoadAllMovies])

  // Stats calculations - use totalMoviesProp for accurate count
  const stats = {
    totalUsers: users.length,
    adminUsers: users.filter(u => u.is_admin).length,
    totalMovies: totalMoviesProp || movies.length,
    watchedMovies: movies.filter(m => m.watched).length,
    activeSessions: votingSessions.filter(s => s.status === 'active').length,
    upcomingEvents: scheduledEvents.filter(e => new Date(e.scheduled_date) >= new Date() && !e.completed).length,
    openBugs: bugReports.filter(r => r.status === 'open').length,
    activeAnnouncements: announcements.filter(a => a.active).length
  }

  // Filtered data
  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredMovies = movies.filter(m =>
    m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.added_by?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredBugReports = bugReports.filter(r =>
    statusFilter === 'all' || r.status === statusFilter
  )

  const getMovieCount = (userName) => movies.filter(m => m.added_by === userName).length

  const getCollectionOwner = (collection) => {
    const owner = users.find(u => u.auth_id === collection.user_id)
    return owner?.name || 'Unknown'
  }

  const getSessionCreator = (session) => {
    const creator = users.find(u => u.auth_id === session.created_by)
    return creator?.name || 'Unknown'
  }

  // Confirm helper
  const showConfirm = (title, message, onConfirm) => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm })
  }

  // Navigation helper
  const navigateTo = (section) => {
    setActiveSection(section)
    setSearchQuery('')
    setMobileMenuOpen(false)
  }

  // User handlers
  const handleEditUser = (user) => {
    setEditingUser(user)
    setUserForm({ name: user.name, avatar: user.avatar })
  }

  const handleUserUpdate = async () => {
    if (!editingUser || !userForm.name.trim()) return
    setLoading(true)
    try {
      await onEditUser(editingUser.id, { name: userForm.name.trim(), avatar: userForm.avatar })
      setEditingUser(null)
      setUserForm({ name: '', avatar: null })
      addToast('User updated', 'success')
    } catch (err) {
      addToast('Failed to update user', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = (user) => {
    showConfirm('Delete User', `Delete "${user.name}"?`, async () => {
      try {
        await onDeleteUser(user.id)
        addToast('User deleted', 'success')
      } catch (err) {
        addToast('Failed to delete user', 'error')
      }
    })
  }

  // Movie handlers
  const handleDeleteMovie = (movie) => {
    showConfirm('Delete Movie', `Delete "${movie.title}"?`, async () => {
      try {
        await onDeleteMovie(movie.id)
        addToast('Movie deleted', 'success')
      } catch (err) {
        addToast('Failed to delete movie', 'error')
      }
    })
  }

  // Event handlers
  const handleDeleteEvent = (event) => {
    showConfirm('Delete Event', `Delete event for "${event.movie_title}"?`, async () => {
      try {
        await deleteMovieNight(event.id, true)
        setScheduledEvents(prev => prev.filter(e => e.id !== event.id))
        addToast('Event deleted', 'success')
      } catch (err) {
        addToast('Failed to delete event', 'error')
      }
    })
  }

  // Announcement handlers
  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editingAnnouncement) {
        await onEditAnnouncement(editingAnnouncement.id, {
          title: announcementForm.title,
          message: announcementForm.message,
          type: announcementForm.type,
          expires_at: announcementForm.expires_at || null
        })
      } else {
        await onAddAnnouncement(
          announcementForm.title,
          announcementForm.message,
          announcementForm.type,
          announcementForm.expires_at || null
        )
      }
      setShowAnnouncementForm(false)
      setEditingAnnouncement(null)
      setAnnouncementForm({ title: '', message: '', type: 'info', expires_at: '' })
    } catch (err) {
      addToast('Failed to save', 'error')
    } finally {
      setLoading(false)
    }
  }

  const startEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement)
    setAnnouncementForm({
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
      expires_at: announcement.expires_at ? announcement.expires_at.split('T')[0] : ''
    })
    setShowAnnouncementForm(true)
  }

  // Changelog handlers
  const handleChangelogSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editingChangelog) {
        await onEditChangelog(editingChangelog.id, {
          title: changelogForm.title,
          description: changelogForm.description,
          type: changelogForm.type,
          version: changelogForm.version || null
        })
      } else {
        await onAddChangelog(
          changelogForm.title,
          changelogForm.description,
          changelogForm.type,
          changelogForm.version || null
        )
      }
      setShowChangelogForm(false)
      setEditingChangelog(null)
      setChangelogForm({ title: '', description: '', type: 'feature', version: '' })
    } catch (err) {
      addToast('Failed to save', 'error')
    } finally {
      setLoading(false)
    }
  }

  const startEditChangelog = (entry) => {
    setEditingChangelog(entry)
    setChangelogForm({
      title: entry.title,
      description: entry.description,
      type: entry.type,
      version: entry.version || ''
    })
    setShowChangelogForm(true)
  }

  // Bug report handlers
  const selectBugReport = (report) => {
    setSelectedBugReport(report)
    setBugReportStatus(report.status)
    setBugReportNotes(report.admin_notes || '')
  }

  const handleBugReportUpdate = async () => {
    if (!selectedBugReport) return
    setLoading(true)
    try {
      await onEditBugReport(selectedBugReport.id, {
        status: bugReportStatus,
        admin_notes: bugReportNotes
      })
      setSelectedBugReport(null)
      addToast('Updated', 'success')
    } catch (err) {
      addToast('Failed to update', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Mobile Header */}
      <header className="md:hidden bg-gray-800 border-b border-gray-700 p-3 flex items-center justify-between sticky top-0 z-30">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-gray-700 rounded"
        >
          <span className="text-xl">{mobileMenuOpen ? '✕' : '☰'}</span>
        </button>
        <h1 className="font-bold">Admin</h1>
        <button onClick={onViewAsUser} className="p-2 hover:bg-gray-700 rounded">
          <span className="text-xl">👁️</span>
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-gray-800 w-64 h-full p-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xl">🎬</span>
              <span className="font-bold">Admin Panel</span>
            </div>
            <nav className="space-y-1">
              {SIDEBAR_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                    activeSection === item.id
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.id === 'bugs' && stats.openBugs > 0 && (
                    <span className="ml-auto bg-red-500 text-xs px-2 py-0.5 rounded-full">{stats.openBugs}</span>
                  )}
                </button>
              ))}
            </nav>
            <div className="mt-6 pt-6 border-t border-gray-700 space-y-1">
              <button onClick={onViewAsUser} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-700">
                <span>👁️</span><span>View as User</span>
              </button>
              <button onClick={onSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-red-400">
                <span>🚪</span><span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 bg-gray-800 border-r border-gray-700 flex-col fixed h-screen">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎬</span>
              <span className="font-bold">Admin Panel</span>
            </div>
          </div>
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {SIDEBAR_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  activeSection === item.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
                {item.id === 'bugs' && stats.openBugs > 0 && (
                  <span className="ml-auto bg-red-500 text-xs px-2 py-0.5 rounded-full">{stats.openBugs}</span>
                )}
                {item.id === 'sessions' && stats.activeSessions > 0 && (
                  <span className="ml-auto bg-blue-500 text-xs px-2 py-0.5 rounded-full">{stats.activeSessions}</span>
                )}
              </button>
            ))}
          </nav>
          <div className="p-2 border-t border-gray-700 space-y-1">
            <button onClick={onViewAsUser} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white">
              <span>👁️</span><span>View as User</span>
            </button>
            <button onClick={onSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-red-400">
              <span>🚪</span><span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 min-h-screen">
          {/* Desktop Header */}
          <header className="hidden md:flex bg-gray-800 border-b border-gray-700 p-4 sticky top-0 z-10 items-center justify-between">
            <h1 className="text-xl font-bold">
              {SIDEBAR_ITEMS.find(i => i.id === activeSection)?.label || 'Dashboard'}
            </h1>
            {['users', 'movies', 'collections'].includes(activeSection) && (
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg w-64"
              />
            )}
          </header>

          <div className="p-4 md:p-6">
            {/* Search for mobile */}
            {['users', 'movies', 'collections'].includes(activeSection) && (
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="md:hidden w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg mb-4"
              />
            )}

            {/* Dashboard */}
            {activeSection === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <StatCard icon="👥" label="Users" value={stats.totalUsers} sublabel={`${stats.adminUsers} admins`} />
                  <StatCard icon="🎬" label="Movies" value={stats.totalMovies} sublabel={`${stats.watchedMovies} watched`} />
                  <StatCard icon="🗳️" label="Sessions" value={stats.activeSessions} color="blue" />
                  <StatCard icon="📅" label="Events" value={stats.upcomingEvents} color="green" />
                  <StatCard icon="🐛" label="Bugs" value={stats.openBugs} color={stats.openBugs > 0 ? 'red' : 'gray'} />
                  <StatCard icon="📢" label="Announces" value={stats.activeAnnouncements} />
                  <StatCard icon="📚" label="Collections" value={collections.length} />
                  <StatCard icon="📝" label="Changelog" value={changelog.length} />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <h3 className="font-bold mb-3">🎬 Recent Movies</h3>
                    <div className="space-y-2">
                      {movies.slice(0, 5).map(movie => (
                        <div key={movie.id} className="flex items-center gap-3 p-2 bg-gray-700/50 rounded">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-sm">{movie.title}</p>
                            <p className="text-xs text-gray-400">by {movie.added_by}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <h3 className="font-bold mb-3">🐛 Open Bugs</h3>
                    <div className="space-y-2">
                      {bugReports.filter(r => r.status === 'open').slice(0, 5).map(report => (
                        <div
                          key={report.id}
                          onClick={() => { navigateTo('bugs'); selectBugReport(report); }}
                          className="p-2 bg-gray-700/50 rounded cursor-pointer hover:bg-gray-700"
                        >
                          <p className="font-medium truncate text-sm">{report.title}</p>
                          <p className="text-xs text-gray-400">by {report.user_name}</p>
                        </div>
                      ))}
                      {bugReports.filter(r => r.status === 'open').length === 0 && (
                        <p className="text-gray-500 text-sm">No open bugs</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Section */}
            {activeSection === 'users' && (
              <div className="space-y-4">
                {editingUser && (
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <h3 className="font-bold mb-4">Edit: {editingUser.name}</h3>
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={userForm.name}
                        onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded"
                        placeholder="Name"
                      />
                      <div className="flex items-center gap-3">
                        <Avatar avatar={userForm.avatar} size="md" />
                        <button onClick={() => setShowAvatarPicker(!showAvatarPicker)} className="px-3 py-1.5 text-sm bg-gray-600 hover:bg-gray-500 rounded">
                          Change Avatar
                        </button>
                      </div>
                      {showAvatarPicker && (
                        <AvatarPicker
                          value={userForm.avatar}
                          onChange={(avatar) => { setUserForm(prev => ({ ...prev, avatar })); setShowAvatarPicker(false); }}
                          darkMode={true}
                        />
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingUser(null); setShowAvatarPicker(false); }} className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded">
                          Cancel
                        </button>
                        <button onClick={handleUserUpdate} disabled={loading} className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded disabled:opacity-50">
                          {loading ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Desktop Table */}
                <div className="hidden md:block bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-700/50">
                      <tr>
                        <th className="text-left p-3 font-medium">User</th>
                        <th className="text-left p-3 font-medium">Movies</th>
                        <th className="text-left p-3 font-medium">Role</th>
                        <th className="text-right p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-gray-700/30">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <Avatar avatar={user.avatar} size="sm" />
                              <span className="font-medium">{user.name}</span>
                            </div>
                          </td>
                          <td className="p-3 text-gray-400">{getMovieCount(user.name)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 text-xs rounded ${user.is_admin ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-600 text-gray-400'}`}>
                              {user.is_admin ? 'Admin' : 'User'}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleEditUser(user)} className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-500 rounded">Edit</button>
                              <button onClick={() => onToggleUserAdmin(user.id, !user.is_admin)} className={`px-3 py-1 text-sm rounded ${user.is_admin ? 'bg-gray-600' : 'bg-purple-600'}`}>
                                {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                              </button>
                              {user.id !== currentUserId && (
                                <button onClick={() => handleDeleteUser(user)} className="px-3 py-1 text-sm bg-red-600 hover:bg-red-500 rounded">Delete</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {filteredUsers.map(user => (
                    <div key={user.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar avatar={user.avatar} size="md" />
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-gray-400">{getMovieCount(user.name)} movies</p>
                        </div>
                        {user.is_admin && <span className="ml-auto px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded">Admin</span>}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => handleEditUser(user)} className="px-3 py-1.5 text-sm bg-blue-600 rounded">Edit</button>
                        <button onClick={() => onToggleUserAdmin(user.id, !user.is_admin)} className={`px-3 py-1.5 text-sm rounded ${user.is_admin ? 'bg-gray-600' : 'bg-purple-600'}`}>
                          {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                        {user.id !== currentUserId && (
                          <button onClick={() => handleDeleteUser(user)} className="px-3 py-1.5 text-sm bg-red-600 rounded">Delete</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Movies Section */}
            {activeSection === 'movies' && (
              <div className="space-y-4">
                {/* Desktop Table */}
                <div className="hidden md:block bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-700/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Movie</th>
                        <th className="text-left p-3 font-medium">Added By</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-right p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {filteredMovies.map(movie => (
                        <tr key={movie.id} className="hover:bg-gray-700/30">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              {movie.poster && <img src={movie.poster} alt="" className="w-10 h-14 object-cover rounded" />}
                              <div>
                                <p className="font-medium">{movie.title}</p>
                                <p className="text-xs text-gray-400">{movie.year}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-gray-400">{movie.added_by}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 text-xs rounded ${movie.watched ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-400'}`}>
                              {movie.watched ? 'Watched' : 'Unwatched'}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => onEditMovie(movie)} className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-500 rounded">Edit</button>
                              <button onClick={() => handleDeleteMovie(movie)} className="px-3 py-1 text-sm bg-red-600 hover:bg-red-500 rounded">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {filteredMovies.map(movie => (
                    <div key={movie.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                      <div className="flex gap-3">
                        {movie.poster && <img src={movie.poster} alt="" className="w-12 h-18 object-cover rounded flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{movie.title}</p>
                          <p className="text-xs text-gray-400">{movie.year} - {movie.added_by}</p>
                          <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${movie.watched ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-400'}`}>
                            {movie.watched ? 'Watched' : 'Unwatched'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => onEditMovie(movie)} className="flex-1 px-3 py-1.5 text-sm bg-blue-600 rounded">Edit</button>
                        <button onClick={() => handleDeleteMovie(movie)} className="flex-1 px-3 py-1.5 text-sm bg-red-600 rounded">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scheduled Events Section */}
            {activeSection === 'events' && (
              <div className="space-y-3">
                {eventsLoading ? (
                  <div className="text-center py-8"><span className="animate-spin text-2xl">🎬</span></div>
                ) : scheduledEvents.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No scheduled events</p>
                ) : (
                  scheduledEvents.map(event => {
                    const isPast = new Date(event.scheduled_date) < new Date()
                    return (
                      <div key={event.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{event.movie_title}</p>
                            <p className="text-sm text-gray-400">{formatDate(event.scheduled_date)} {event.scheduled_time && `@ ${event.scheduled_time}`}</p>
                            {event.notes && <p className="text-xs text-gray-500 mt-1">{event.notes}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded ${event.completed ? 'bg-green-500/20 text-green-400' : isPast ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                              {event.completed ? 'Done' : isPast ? 'Past' : 'Soon'}
                            </span>
                            <button onClick={() => handleDeleteEvent(event)} className="px-3 py-1 text-sm bg-red-600 rounded">Delete</button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {/* Voting Sessions Section */}
            {activeSection === 'sessions' && (
              <div className="space-y-3">
                {votingSessions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No voting sessions</p>
                ) : (
                  votingSessions.map(session => (
                    <div key={session.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{session.name || `Session ${session.id.slice(0, 8)}`}</p>
                          <p className="text-sm text-gray-400">
                            by {getSessionCreator(session)}
                            {session.created_at && (
                              <span> • {formatDate(session.created_at)}</span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded ${session.status === 'active' ? 'bg-green-500/20 text-green-400' : session.status === 'completed' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-600 text-gray-400'}`}>
                            {session.status}
                          </span>
                          {onDeleteSession && (
                            <button
                              onClick={() => showConfirm('Delete Session', `Delete session "${session.name}"? This cannot be undone.`, async () => {
                                try {
                                  await onDeleteSession(session.id)
                                  addToast('Session deleted', 'success')
                                } catch (err) {
                                  addToast('Failed to delete session', 'error')
                                }
                              })}
                              className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Collections Section */}
            {activeSection === 'collections' && (
              <div className="space-y-3">
                {collections.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No collections</p>
                ) : (
                  collections.filter(c => c.name?.toLowerCase().includes(searchQuery.toLowerCase())).map(collection => (
                    <div key={collection.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{collection.emoji || '📁'}</span>
                          <div>
                            <p className="font-medium">{collection.name}</p>
                            <p className="text-xs text-gray-400">by {getCollectionOwner(collection)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => showConfirm('Delete Collection', `Delete "${collection.name}"?`, async () => {
                            try { await onDeleteCollection(collection.id); addToast('Deleted', 'success'); } catch { addToast('Failed', 'error'); }
                          })}
                          className="px-3 py-1 text-sm bg-red-600 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Announcements Section */}
            {activeSection === 'announcements' && (
              <div className="space-y-4">
                {!showAnnouncementForm ? (
                  <>
                    <button onClick={() => setShowAnnouncementForm(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg">
                      + New Announcement
                    </button>
                    <div className="space-y-3">
                      {announcements.map(a => (
                        <div key={a.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`px-2 py-0.5 text-xs rounded text-white ${ANNOUNCEMENT_TYPES.find(t => t.value === a.type)?.color}`}>{a.type}</span>
                            {!a.active && <span className="px-2 py-0.5 text-xs bg-gray-600 rounded">Inactive</span>}
                          </div>
                          <h4 className="font-bold">{a.title}</h4>
                          <p className="text-sm text-gray-400 mt-1">{a.message}</p>
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => startEditAnnouncement(a)} className="px-3 py-1 text-sm bg-blue-600 rounded">Edit</button>
                            <button onClick={() => showConfirm('Delete', 'Delete this announcement?', () => onDeleteAnnouncement(a.id))} className="px-3 py-1 text-sm bg-red-600 rounded">Delete</button>
                          </div>
                        </div>
                      ))}
                      {announcements.length === 0 && <p className="text-center text-gray-500 py-8">No announcements</p>}
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleAnnouncementSubmit} className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-4">
                    <h3 className="font-bold">{editingAnnouncement ? 'Edit' : 'New'} Announcement</h3>
                    <input type="text" placeholder="Title" value={announcementForm.title} onChange={(e) => setAnnouncementForm(p => ({ ...p, title: e.target.value }))} required className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded" />
                    <textarea placeholder="Message" value={announcementForm.message} onChange={(e) => setAnnouncementForm(p => ({ ...p, message: e.target.value }))} required rows={3} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded" />
                    <div className="grid grid-cols-2 gap-3">
                      <select value={announcementForm.type} onChange={(e) => setAnnouncementForm(p => ({ ...p, type: e.target.value }))} className="px-3 py-2 bg-gray-700 border border-gray-600 rounded">
                        {ANNOUNCEMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      <input type="date" value={announcementForm.expires_at} onChange={(e) => setAnnouncementForm(p => ({ ...p, expires_at: e.target.value }))} className="px-3 py-2 bg-gray-700 border border-gray-600 rounded" />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setShowAnnouncementForm(false); setEditingAnnouncement(null); }} className="flex-1 px-4 py-2 bg-gray-600 rounded">Cancel</button>
                      <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-purple-600 rounded disabled:opacity-50">{loading ? 'Saving...' : 'Save'}</button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Changelog Section */}
            {activeSection === 'changelog' && (
              <div className="space-y-4">
                {!showChangelogForm ? (
                  <>
                    <button onClick={() => setShowChangelogForm(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg">
                      + New Entry
                    </button>
                    <div className="space-y-3">
                      {changelog.map(entry => (
                        <div key={entry.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`px-2 py-0.5 text-xs rounded text-white ${CHANGELOG_TYPES.find(t => t.value === entry.type)?.color}`}>
                              {CHANGELOG_TYPES.find(t => t.value === entry.type)?.label}
                            </span>
                            {entry.version && <span className="px-2 py-0.5 text-xs bg-gray-600 rounded">v{entry.version}</span>}
                          </div>
                          <h4 className="font-bold">{entry.title}</h4>
                          <p className="text-sm text-gray-400 mt-1">{entry.description}</p>
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => startEditChangelog(entry)} className="px-3 py-1 text-sm bg-blue-600 rounded">Edit</button>
                            <button onClick={() => showConfirm('Delete', 'Delete this entry?', () => onDeleteChangelog(entry.id))} className="px-3 py-1 text-sm bg-red-600 rounded">Delete</button>
                          </div>
                        </div>
                      ))}
                      {changelog.length === 0 && <p className="text-center text-gray-500 py-8">No entries</p>}
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleChangelogSubmit} className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-4">
                    <h3 className="font-bold">{editingChangelog ? 'Edit' : 'New'} Entry</h3>
                    <input type="text" placeholder="Title" value={changelogForm.title} onChange={(e) => setChangelogForm(p => ({ ...p, title: e.target.value }))} required className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded" />
                    <textarea placeholder="Description" value={changelogForm.description} onChange={(e) => setChangelogForm(p => ({ ...p, description: e.target.value }))} required rows={3} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded" />
                    <div className="grid grid-cols-2 gap-3">
                      <select value={changelogForm.type} onChange={(e) => setChangelogForm(p => ({ ...p, type: e.target.value }))} className="px-3 py-2 bg-gray-700 border border-gray-600 rounded">
                        {CHANGELOG_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      <input type="text" placeholder="Version" value={changelogForm.version} onChange={(e) => setChangelogForm(p => ({ ...p, version: e.target.value }))} className="px-3 py-2 bg-gray-700 border border-gray-600 rounded" />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setShowChangelogForm(false); setEditingChangelog(null); }} className="flex-1 px-4 py-2 bg-gray-600 rounded">Cancel</button>
                      <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-purple-600 rounded disabled:opacity-50">{loading ? 'Saving...' : 'Save'}</button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Bug Reports Section */}
            {activeSection === 'bugs' && (
              <div className="space-y-4">
                {!selectedBugReport ? (
                  <>
                    <div className="flex gap-2 flex-wrap">
                      {['all', 'open', 'in_progress', 'resolved', 'closed'].map(status => (
                        <button key={status} onClick={() => setStatusFilter(status)} className={`px-3 py-1.5 text-sm rounded-lg ${statusFilter === status ? 'bg-purple-600' : 'bg-gray-700'}`}>
                          {status === 'all' ? 'All' : status.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-3">
                      {filteredBugReports.map(report => (
                        <div key={report.id} onClick={() => selectBugReport(report)} className="bg-gray-800 rounded-lg p-4 border border-gray-700 cursor-pointer hover:border-purple-500">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 text-xs rounded text-white ${STATUS_COLORS[report.status]}`}>{report.status.replace('_', ' ')}</span>
                          </div>
                          <h4 className="font-bold">{report.title}</h4>
                          <p className="text-sm text-gray-400 mt-1 line-clamp-2">{report.description}</p>
                          <p className="text-xs text-gray-500 mt-2">by {report.user_name || 'Unknown'}</p>
                        </div>
                      ))}
                      {filteredBugReports.length === 0 && <p className="text-center text-gray-500 py-8">No bug reports</p>}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <button onClick={() => setSelectedBugReport(null)} className="text-gray-400 hover:text-white text-sm">← Back</button>
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <span className={`px-2 py-0.5 text-xs rounded text-white ${STATUS_COLORS[selectedBugReport.status]}`}>{selectedBugReport.status.replace('_', ' ')}</span>
                      <h3 className="text-lg font-bold mt-2">{selectedBugReport.title}</h3>
                      <p className="text-gray-400 mt-2">{selectedBugReport.description}</p>
                      <p className="text-xs text-gray-500 mt-4">by {selectedBugReport.user_name || 'Unknown'} - {formatDate(selectedBugReport.created_at)}</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-4">
                      <select value={bugReportStatus} onChange={(e) => setBugReportStatus(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded">
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                      <textarea value={bugReportNotes} onChange={(e) => setBugReportNotes(e.target.value)} rows={3} placeholder="Admin notes..." className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded" />
                      <div className="flex gap-2">
                        <button onClick={handleBugReportUpdate} disabled={loading} className="flex-1 px-4 py-2 bg-purple-600 rounded disabled:opacity-50">{loading ? 'Saving...' : 'Save'}</button>
                        <button onClick={() => showConfirm('Delete', 'Delete this report?', async () => { await onDeleteBugReport(selectedBugReport.id); setSelectedBugReport(null); })} className="px-4 py-2 bg-red-600 rounded">Delete</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Confirm"
        confirmStyle="danger"
        onConfirm={() => { confirmDialog.onConfirm?.(); setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null }); }}
        onCancel={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null })}
        darkMode={true}
      />
    </div>
  )
}

function StatCard({ icon, label, value, sublabel, color = 'purple' }) {
  const colors = {
    purple: 'bg-purple-500/10 border-purple-500/30',
    blue: 'bg-blue-500/10 border-blue-500/30',
    green: 'bg-green-500/10 border-green-500/30',
    red: 'bg-red-500/10 border-red-500/30',
    gray: 'bg-gray-500/10 border-gray-500/30'
  }
  return (
    <div className={`${colors[color]} border rounded-lg p-3 md:p-4`}>
      <div className="flex items-center gap-2 md:gap-3">
        <span className="text-xl md:text-2xl">{icon}</span>
        <div>
          <p className="text-xl md:text-2xl font-bold">{value}</p>
          <p className="text-xs md:text-sm text-gray-400">{label}</p>
          {sublabel && <p className="text-xs text-gray-500 hidden md:block">{sublabel}</p>}
        </div>
      </div>
    </div>
  )
}
