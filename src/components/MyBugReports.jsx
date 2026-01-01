import { useEffect } from 'react'
import { formatDate } from '../utils/helpers'

const STATUS_COLORS = {
  open: 'bg-yellow-500',
  in_progress: 'bg-blue-500',
  resolved: 'bg-green-500',
  closed: 'bg-gray-500'
}

const STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed'
}

export default function MyBugReports({
  onClose,
  bugReports,
  onFetchBugReports,
  userId,
  darkMode
}) {
  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const border = darkMode ? 'border-gray-700' : 'border-gray-300'

  useEffect(() => {
    if (userId) {
      onFetchBugReports(userId)
    }
  }, [userId, onFetchBugReports])

  // Filter to only user's reports
  const myReports = bugReports.filter(r => r.user_id === userId)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 modal-backdrop">
      <div className={`${card} rounded-lg w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col modal-content`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${border}`}>
          <h2 className="text-xl font-bold">My Bug Reports</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-500/20 rounded-full transition-colors"
          >
            X
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {myReports.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>You haven't submitted any bug reports yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myReports.map(report => (
                <div
                  key={report.id}
                  className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs rounded text-white ${STATUS_COLORS[report.status]}`}>
                          {STATUS_LABELS[report.status]}
                        </span>
                      </div>
                      <h3 className="font-medium">{report.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">{report.description}</p>
                      <div className="text-xs text-gray-500 mt-2">
                        Submitted {formatDate(report.created_at)}
                        {report.resolved_at && (
                          <span> - Resolved {formatDate(report.resolved_at)}</span>
                        )}
                      </div>
                      {report.admin_notes && (
                        <div className={`mt-3 p-2 rounded text-sm ${
                          darkMode ? 'bg-gray-600/50' : 'bg-gray-200'
                        }`}>
                          <span className="text-xs text-gray-500 block mb-1">Admin response:</span>
                          {report.admin_notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
