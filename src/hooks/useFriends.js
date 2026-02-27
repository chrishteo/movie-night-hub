import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getFriends,
  getPendingFriendRequests,
  getSentFriendRequests,
  sendFriendRequest,
  respondToFriendRequest,
  cancelFriendRequest,
  removeFriend,
  subscribeToFriendRequests
} from '../lib/database'

export function useFriends(userId) {
  const [friends, setFriends] = useState([])
  const [pendingReceived, setPendingReceived] = useState([])
  const [pendingSent, setPendingSent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Pending request count for badge
  const pendingCount = useMemo(() => {
    return pendingReceived.length
  }, [pendingReceived])

  // List of friend user IDs for easy lookups
  const friendIds = useMemo(() => {
    return friends.map(f => f.friend_id)
  }, [friends])

  const fetchAll = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const [friendsData, receivedData, sentData] = await Promise.all([
        getFriends(userId),
        getPendingFriendRequests(userId),
        getSentFriendRequests(userId)
      ])
      setFriends(friendsData || [])
      setPendingReceived(receivedData || [])
      setPendingSent(sentData || [])
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching friends:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchAll()

    if (!userId) return

    // Real-time subscription for friend requests
    const subscription = subscribeToFriendRequests(userId, (payload) => {
      // Refetch all data on any change to keep everything in sync
      fetchAll()
    })

    return () => subscription.unsubscribe()
  }, [fetchAll, userId])

  // Send a friend request
  const sendRequest = useCallback(async (receiverId) => {
    if (!userId) return

    try {
      const request = await sendFriendRequest(userId, receiverId)
      setPendingSent(prev => [...prev, request])
      return request
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [userId])

  // Accept a friend request
  const acceptRequest = useCallback(async (requestId) => {
    try {
      await respondToFriendRequest(requestId, true)
      // Refetch to update friends list
      fetchAll()
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [fetchAll])

  // Reject a friend request
  const rejectRequest = useCallback(async (requestId) => {
    try {
      await respondToFriendRequest(requestId, false)
      setPendingReceived(prev => prev.filter(r => r.id !== requestId))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  // Cancel a sent friend request
  const cancelRequest = useCallback(async (requestId) => {
    try {
      await cancelFriendRequest(requestId)
      setPendingSent(prev => prev.filter(r => r.id !== requestId))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  // Remove a friend (unfriend)
  const unfriend = useCallback(async (friendId) => {
    if (!userId) return

    try {
      await removeFriend(userId, friendId)
      setFriends(prev => prev.filter(f => f.friend_id !== friendId))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [userId])

  // Check if a user is a friend
  const isFriend = useCallback((otherUserId) => {
    return friendIds.includes(otherUserId)
  }, [friendIds])

  // Check if there's a pending request with a user
  const hasPendingRequest = useCallback((otherUserId) => {
    const sentToUser = pendingSent.some(r => r.receiver_id === otherUserId)
    const receivedFromUser = pendingReceived.some(r => r.sender_id === otherUserId)
    return sentToUser || receivedFromUser
  }, [pendingSent, pendingReceived])

  // Get pending request from a specific user (if any)
  const getPendingFromUser = useCallback((otherUserId) => {
    return pendingReceived.find(r => r.sender_id === otherUserId)
  }, [pendingReceived])

  return {
    friends,
    pendingReceived,
    pendingSent,
    pendingCount,
    friendIds,
    loading,
    error,
    sendRequest,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    unfriend,
    isFriend,
    hasPendingRequest,
    getPendingFromUser,
    refetch: fetchAll
  }
}
