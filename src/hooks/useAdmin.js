import { useState, useEffect, useCallback } from 'react'
import {
  checkIsAdmin,
  setUserAdmin,
  deleteUserAsAdmin,
  deleteMovieAsAdmin,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getBugReports,
  createBugReport,
  updateBugReport,
  deleteBugReport,
  subscribeToAnnouncements
} from '../lib/database'

export function useAdmin(authUserId = null) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [announcements, setAnnouncements] = useState([])
  const [bugReports, setBugReports] = useState([])

  // Check if current user is admin
  useEffect(() => {
    async function checkAdminStatus() {
      if (!authUserId) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      try {
        const adminStatus = await checkIsAdmin(authUserId)
        setIsAdmin(adminStatus)
      } catch (err) {
        console.error('Error checking admin status:', err)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [authUserId])

  // Fetch announcements
  const fetchAnnouncements = useCallback(async (activeOnly = true) => {
    try {
      const data = await getAnnouncements(activeOnly)
      setAnnouncements(data)
      return data
    } catch (err) {
      console.error('Error fetching announcements:', err)
      return []
    }
  }, [])

  // Subscribe to announcement changes
  useEffect(() => {
    const subscription = subscribeToAnnouncements((payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        setAnnouncements(prev => [payload.new, ...prev])
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        setAnnouncements(prev => prev.map(a => a.id === payload.new.id ? payload.new : a))
      } else if (payload.eventType === 'DELETE' && payload.old?.id) {
        setAnnouncements(prev => prev.filter(a => a.id !== payload.old.id))
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Fetch bug reports (all for admin, user's own for non-admin)
  const fetchBugReports = useCallback(async (userIdFilter = null) => {
    try {
      const data = await getBugReports(userIdFilter)
      setBugReports(data)
      return data
    } catch (err) {
      console.error('Error fetching bug reports:', err)
      return []
    }
  }, [])

  // Admin actions
  const toggleUserAdmin = useCallback(async (userId, makeAdmin) => {
    if (!isAdmin) throw new Error('Not authorized')
    return await setUserAdmin(userId, makeAdmin)
  }, [isAdmin])

  const removeUser = useCallback(async (userId) => {
    if (!isAdmin) throw new Error('Not authorized')
    await deleteUserAsAdmin(userId)
  }, [isAdmin])

  const removeMovie = useCallback(async (movieId) => {
    if (!isAdmin) throw new Error('Not authorized')
    await deleteMovieAsAdmin(movieId)
  }, [isAdmin])

  // Announcement actions
  const addAnnouncement = useCallback(async (title, message, type = 'info', expiresAt = null, createdBy = null) => {
    if (!isAdmin) throw new Error('Not authorized')
    const newAnnouncement = await createAnnouncement(title, message, type, expiresAt, createdBy)
    setAnnouncements(prev => [newAnnouncement, ...prev])
    return newAnnouncement
  }, [isAdmin])

  const editAnnouncement = useCallback(async (id, updates) => {
    if (!isAdmin) throw new Error('Not authorized')
    const updated = await updateAnnouncement(id, updates)
    setAnnouncements(prev => prev.map(a => a.id === id ? updated : a))
    return updated
  }, [isAdmin])

  const removeAnnouncement = useCallback(async (id) => {
    if (!isAdmin) throw new Error('Not authorized')
    await deleteAnnouncement(id)
    setAnnouncements(prev => prev.filter(a => a.id !== id))
  }, [isAdmin])

  // Bug report actions
  const submitBugReport = useCallback(async (title, description, userId = null, userName = null) => {
    const newReport = await createBugReport(title, description, userId, userName)
    setBugReports(prev => [newReport, ...prev])
    return newReport
  }, [])

  const editBugReport = useCallback(async (id, updates) => {
    if (!isAdmin) throw new Error('Not authorized')
    const updated = await updateBugReport(id, updates)
    setBugReports(prev => prev.map(r => r.id === id ? updated : r))
    return updated
  }, [isAdmin])

  const removeBugReport = useCallback(async (id) => {
    if (!isAdmin) throw new Error('Not authorized')
    await deleteBugReport(id)
    setBugReports(prev => prev.filter(r => r.id !== id))
  }, [isAdmin])

  return {
    isAdmin,
    loading,
    // Announcements
    announcements,
    fetchAnnouncements,
    addAnnouncement,
    editAnnouncement,
    removeAnnouncement,
    // Bug reports
    bugReports,
    fetchBugReports,
    submitBugReport,
    editBugReport,
    removeBugReport,
    // Admin actions
    toggleUserAdmin,
    removeUser,
    removeMovie
  }
}
