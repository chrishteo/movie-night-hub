import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getMyInvites,
  sendWatchInvites,
  respondToInvite,
  cancelInvite,
  subscribeToWatchInvites,
  setUserMovieStatus
} from '../lib/database'

export function useInvites(authUserId) {
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Pending count for badge
  const pendingCount = useMemo(() => {
    return invites.filter(inv => inv.status === 'pending').length
  }, [invites])

  const fetchInvites = useCallback(async () => {
    if (!authUserId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await getMyInvites(authUserId)
      setInvites(data || [])
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching invites:', err)
    } finally {
      setLoading(false)
    }
  }, [authUserId])

  useEffect(() => {
    fetchInvites()

    if (!authUserId) return

    // Real-time subscription for invites sent to me
    const subscription = subscribeToWatchInvites(authUserId, (payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        // New invite - refetch to get joined data (movie, inviter info)
        fetchInvites()
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        // Status changed (accepted/declined)
        setInvites(prev => prev.map(inv =>
          inv.id === payload.new.id ? { ...inv, ...payload.new } : inv
        ))
      } else if (payload.eventType === 'DELETE' && payload.old) {
        setInvites(prev => prev.filter(inv => inv.id !== payload.old.id))
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchInvites, authUserId])

  // Send invites to multiple users
  const sendInvites = useCallback(async (movieId, inviteeIds) => {
    if (!authUserId) return

    try {
      await sendWatchInvites(movieId, authUserId, inviteeIds)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [authUserId])

  // Accept invite - marks the movie as watched for current user
  const acceptInvite = useCallback(async (invite, rating = null) => {
    if (!authUserId) return

    try {
      // 1. Mark as watched for myself (RLS allows this)
      const statusUpdate = { watched: true }
      if (rating) statusUpdate.rating = rating
      await setUserMovieStatus(invite.movie_id, authUserId, statusUpdate)

      // 2. Update invite status to accepted
      await respondToInvite(invite.id, 'accepted')

      // Update local state
      setInvites(prev => prev.map(inv =>
        inv.id === invite.id
          ? { ...inv, status: 'accepted', responded_at: new Date().toISOString() }
          : inv
      ))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [authUserId])

  // Decline invite - just updates status
  const declineInvite = useCallback(async (inviteId) => {
    try {
      await respondToInvite(inviteId, 'declined')

      // Update local state
      setInvites(prev => prev.map(inv =>
        inv.id === inviteId
          ? { ...inv, status: 'declined', responded_at: new Date().toISOString() }
          : inv
      ))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  // Cancel a sent invite (for inviters)
  const cancelSentInvite = useCallback(async (inviteId) => {
    try {
      await cancelInvite(inviteId)
      setInvites(prev => prev.filter(inv => inv.id !== inviteId))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  return {
    invites,
    pendingCount,
    loading,
    error,
    sendInvites,
    acceptInvite,
    declineInvite,
    cancelSentInvite,
    refetch: fetchInvites
  }
}
