import { useState, useEffect } from 'react'
import { Avatar } from './AvatarPicker'
import { formatDate } from '../utils/helpers'

const TABS = ['Users', 'Movies', 'Announcements', 'Bug Reports']

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

export default function AdminPanel({
  onClose,
  darkMode,
  users,
  movies,
  currentUserId,
  // Admin actions
  onToggleUserAdmin,
  onDeleteUser,
  onDeleteMovie,
  // Announcements
  announcements,
  onFetchAnnouncements,
  onAddAnnouncement,
  onEditAnnouncement,
  onDeleteAnnouncement,
  // Bug reports
  bugReports,
  onFetchBugReports,
  onEditBugReport,
  onDeleteBugReport
}) {
  const [activeTab, setActiveTab] = useState('Users')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  // Announcement form state
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState(null)
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    type: 'info',
    expires_at: ''
  })

  // Bug report detail state
  const [selectedBugReport, setSelectedBugReport] = useState(null)
  const [bugReportNotes, setBugReportNotes] = useState('')
  const [bugReportStatus, setBugReportStatus] = useState('open')
  const [statusFilter, setStatusFilter] = useState('all')

  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const border = darkMode ? 'border-gray-700' : 'border-gray-300'
  const input = darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'

  // Fetch data on mount
  useEffect(() => {
    onFetchAnnouncements(false) // Get all announcements, not just active
    onFetchBugReports()
  }, [onFetchAnnouncements, onFetchBugReports])

  // Filter movies by search
  const filteredMovies = movies.filter(m =>
    m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.added_by?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Filter bug reports by status
  const filteredBugReports = bugReports.filter(r =>
    statusFilter === 'all' || r.status === statusFilter
  )

  // Get movie count per user
  const getMovieCount = (userName) => {
    return movies.filter(m => m.added_by === userName).length
  }

  // Handle announcement form submit
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
      console.error('Error saving announcement:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle editing announcement
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

  // Handle bug report update
  const handleBugReportUpdate = async () => {
    if (!selectedBugReport) return
    setLoading(true)
    try {
      await onEditBugReport(selectedBugReport.id, {
        status: bugReportStatus,
        admin_notes: bugReportNotes
      })
      setSelectedBugReport(null)
    } catch (err) {
      console.error('Error updating bug report:', err)
    } finally {
      setLoading(false)
    }
  }

  // Select bug report for detail view
  const selectBugReport = (report) => {
    setSelectedBugReport(report)
    setBugReportStatus(report.status)
    setBugReportNotes(report.admin_notes || '')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 modal-backdrop">
      <div className={`${card} rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col modal-content`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${border}`}>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>Admin Panel</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-500/20 rounded-full transition-colors"
          >
            <span className="text-xl">X</span>
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${border} overflow-x-auto`}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-purple-500 text-purple-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Users Tab */}
          {activeTab === 'Users' && (
            <div className="space-y-2">
              {users.map(user => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    darkMode ? 'bg-gray-700/50' : 'bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar avatar={user.avatar} size="md" />
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {user.name}
                        {user.is_admin && (
                          <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {getMovieCount(user.name)} movies
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleUserAdmin(user.id, !user.is_admin)}
                      className={`px-3 py-1 text-sm rounded ${
                        user.is_admin
                          ? 'bg-gray-600 hover:bg-gray-500'
                          : 'bg-purple-600 hover:bg-purple-500'
                      }`}
                    >
                      {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                    </button>
                    {user.id !== currentUserId && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete user "${user.name}"? This cannot be undone.`)) {
                            onDeleteUser(user.id)
                          }
                        }}
                        className="px-3 py-1 text-sm rounded bg-red-600 hover:bg-red-500"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Movies Tab */}
          {activeTab === 'Movies' && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full px-3 py-2 rounded border ${input}`}
              />
              <div className="space-y-2 max-h-[60vh] overflow-auto">
                {filteredMovies.map(movie => (
                  <div
                    key={movie.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      darkMode ? 'bg-gray-700/50' : 'bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {movie.poster && (
                        <img
                          src={movie.poster}
                          alt={movie.title}
                          className="w-10 h-14 object-cover rounded"
                        />
                      )}
                      <div>
                        <div className="font-medium">{movie.title}</div>
                        <div className="text-xs text-gray-400">
                          Added by {movie.added_by} - {formatDate(movie.created_at)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${movie.title}"? This cannot be undone.`)) {
                          onDeleteMovie(movie.id)
                        }
                      }}
                      className="px-3 py-1 text-sm rounded bg-red-600 hover:bg-red-500"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Announcements Tab */}
          {activeTab === 'Announcements' && (
            <div className="space-y-4">
              {!showAnnouncementForm ? (
                <>
                  <button
                    onClick={() => setShowAnnouncementForm(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded"
                  >
                    + New Announcement
                  </button>
                  <div className="space-y-2">
                    {announcements.map(announcement => (
                      <div
                        key={announcement.id}
                        className={`p-4 rounded-lg ${
                          darkMode ? 'bg-gray-700/50' : 'bg-gray-100'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 text-xs rounded text-white ${
                                ANNOUNCEMENT_TYPES.find(t => t.value === announcement.type)?.color || 'bg-gray-500'
                              }`}>
                                {announcement.type}
                              </span>
                              {!announcement.active && (
                                <span className="px-2 py-0.5 text-xs rounded bg-gray-500 text-white">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <div className="font-medium">{announcement.title}</div>
                            <div className="text-sm text-gray-400 mt-1">{announcement.message}</div>
                            <div className="text-xs text-gray-500 mt-2">
                              Created {formatDate(announcement.created_at)}
                              {announcement.expires_at && ` - Expires ${formatDate(announcement.expires_at)}`}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditAnnouncement(announcement)}
                              className="px-3 py-1 text-sm rounded bg-blue-600 hover:bg-blue-500"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Delete this announcement?')) {
                                  onDeleteAnnouncement(announcement.id)
                                }
                              }}
                              className="px-3 py-1 text-sm rounded bg-red-600 hover:bg-red-500"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {announcements.length === 0 && (
                      <p className="text-center text-gray-400 py-8">No announcements yet</p>
                    )}
                  </div>
                </>
              ) : (
                <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
                  <h3 className="text-lg font-medium">
                    {editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
                  </h3>
                  <input
                    type="text"
                    placeholder="Title"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                    className={`w-full px-3 py-2 rounded border ${input}`}
                  />
                  <textarea
                    placeholder="Message"
                    value={announcementForm.message}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, message: e.target.value }))}
                    required
                    rows={3}
                    className={`w-full px-3 py-2 rounded border ${input}`}
                  />
                  <div className="flex gap-4">
                    <select
                      value={announcementForm.type}
                      onChange={(e) => setAnnouncementForm(prev => ({ ...prev, type: e.target.value }))}
                      className={`flex-1 px-3 py-2 rounded border ${input}`}
                    >
                      {ANNOUNCEMENT_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <input
                      type="date"
                      placeholder="Expires (optional)"
                      value={announcementForm.expires_at}
                      onChange={(e) => setAnnouncementForm(prev => ({ ...prev, expires_at: e.target.value }))}
                      className={`flex-1 px-3 py-2 rounded border ${input}`}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAnnouncementForm(false)
                        setEditingAnnouncement(null)
                        setAnnouncementForm({ title: '', message: '', type: 'info', expires_at: '' })
                      }}
                      className="flex-1 px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : (editingAnnouncement ? 'Update' : 'Create')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Bug Reports Tab */}
          {activeTab === 'Bug Reports' && (
            <div className="space-y-4">
              {!selectedBugReport ? (
                <>
                  <div className="flex gap-2">
                    {['all', 'open', 'in_progress', 'resolved', 'closed'].map(status => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1 text-sm rounded ${
                          statusFilter === status
                            ? 'bg-purple-600'
                            : darkMode ? 'bg-gray-700' : 'bg-gray-200'
                        }`}
                      >
                        {status === 'all' ? 'All' : status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {filteredBugReports.map(report => (
                      <div
                        key={report.id}
                        onClick={() => selectBugReport(report)}
                        className={`p-4 rounded-lg cursor-pointer hover:ring-2 hover:ring-purple-500 ${
                          darkMode ? 'bg-gray-700/50' : 'bg-gray-100'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 text-xs rounded text-white ${STATUS_COLORS[report.status]}`}>
                                {report.status.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="font-medium">{report.title}</div>
                            <div className="text-sm text-gray-400 mt-1 line-clamp-2">
                              {report.description}
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                              By {report.user_name || 'Unknown'} - {formatDate(report.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredBugReports.length === 0 && (
                      <p className="text-center text-gray-400 py-8">No bug reports</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={() => setSelectedBugReport(null)}
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    &larr; Back to list
                  </button>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs rounded text-white ${STATUS_COLORS[selectedBugReport.status]}`}>
                        {selectedBugReport.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium">{selectedBugReport.title}</h3>
                    <p className="text-sm text-gray-400 mt-2">{selectedBugReport.description}</p>
                    <div className="text-xs text-gray-500 mt-4">
                      Reported by {selectedBugReport.user_name || 'Unknown'} on {formatDate(selectedBugReport.created_at)}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="block">
                      <span className="text-sm text-gray-400">Status</span>
                      <select
                        value={bugReportStatus}
                        onChange={(e) => setBugReportStatus(e.target.value)}
                        className={`w-full mt-1 px-3 py-2 rounded border ${input}`}
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-sm text-gray-400">Admin Notes</span>
                      <textarea
                        value={bugReportNotes}
                        onChange={(e) => setBugReportNotes(e.target.value)}
                        rows={3}
                        placeholder="Add notes about this bug report..."
                        className={`w-full mt-1 px-3 py-2 rounded border ${input}`}
                      />
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={handleBugReportUpdate}
                        disabled={loading}
                        className="flex-1 px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this bug report?')) {
                            onDeleteBugReport(selectedBugReport.id)
                            setSelectedBugReport(null)
                          }
                        }}
                        className="px-4 py-2 rounded bg-red-600 hover:bg-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
