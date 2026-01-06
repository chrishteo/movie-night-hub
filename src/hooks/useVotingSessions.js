import { useState, useEffect, useCallback } from 'react'
import {
  getVotingSessions,
  getVotingSession,
  createVotingSession,
  updateVotingSession,
  endVotingSession,
  cancelVotingSession,
  getSessionParticipants,
  addSessionParticipants,
  updateParticipantStatus,
  removeSessionParticipant,
  getMySessionInvites,
  getSessionVotes,
  castSessionVote,
  removeSessionVote,
  clearSessionVotes,
  subscribeToVotingSessions,
  subscribeToSessionParticipants,
  subscribeToSessionVotes
} from '../lib/database'

export function useVotingSessions(authUserId = null) {
  const [sessions, setSessions] = useState([])
  const [myInvites, setMyInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all active sessions
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getVotingSessions(true) // active only
      setSessions(data)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching voting sessions:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch my pending invites
  const fetchMyInvites = useCallback(async () => {
    if (!authUserId) return
    try {
      const data = await getMySessionInvites(authUserId)
      setMyInvites(data)
    } catch (err) {
      console.error('Error fetching session invites:', err)
    }
  }, [authUserId])

  useEffect(() => {
    fetchSessions()
    fetchMyInvites()

    // Subscribe to session changes
    const sessionSub = subscribeToVotingSessions((payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        setSessions(prev => [payload.new, ...prev])
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        setSessions(prev => prev.map(s =>
          s.id === payload.new.id ? { ...s, ...payload.new } : s
        ).filter(s => s.status === 'active'))
      } else if (payload.eventType === 'DELETE' && payload.old?.id) {
        setSessions(prev => prev.filter(s => s.id !== payload.old.id))
      }
      // Refetch invites when sessions change
      fetchMyInvites()
    })

    return () => {
      sessionSub.unsubscribe()
    }
  }, [fetchSessions, fetchMyInvites])

  // Create a new session
  const createSession = useCallback(async (name, participantUserIds = []) => {
    try {
      const session = await createVotingSession(name, authUserId)

      // Add participants if provided
      if (participantUserIds.length > 0) {
        await addSessionParticipants(session.id, participantUserIds)
      }

      // Add creator as accepted participant
      if (authUserId) {
        await addSessionParticipants(session.id, [authUserId])
        await updateParticipantStatus(session.id, authUserId, 'accepted')
      }

      await fetchSessions()
      return session
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [authUserId, fetchSessions])

  // End a session with a winner
  const endSession = useCallback(async (sessionId, winnerMovieId = null) => {
    try {
      await endVotingSession(sessionId, winnerMovieId)
      // Clear votes for this session
      await clearSessionVotes(sessionId)
      await fetchSessions()
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [fetchSessions])

  // Cancel a session
  const cancelSession = useCallback(async (sessionId) => {
    try {
      await cancelVotingSession(sessionId)
      await clearSessionVotes(sessionId)
      await fetchSessions()
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [fetchSessions])

  // Respond to an invite
  const respondToInvite = useCallback(async (sessionId, accept) => {
    if (!authUserId) return
    try {
      await updateParticipantStatus(sessionId, authUserId, accept ? 'accepted' : 'declined')
      await fetchMyInvites()
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [authUserId, fetchMyInvites])

  // Remove a participant (creator only)
  const removeParticipant = useCallback(async (sessionId, userId) => {
    try {
      await removeSessionParticipant(sessionId, userId)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  // Add participants to existing session
  const addParticipants = useCallback(async (sessionId, userIds) => {
    try {
      await addSessionParticipants(sessionId, userIds)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  return {
    sessions,
    myInvites,
    loading,
    error,
    createSession,
    endSession,
    cancelSession,
    respondToInvite,
    removeParticipant,
    addParticipants,
    refetch: fetchSessions,
    refetchInvites: fetchMyInvites
  }
}

// Hook for a single session with participants and votes
export function useVotingSession(sessionId, authUserId = null) {
  const [session, setSession] = useState(null)
  const [participants, setParticipants] = useState([])
  const [votes, setVotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSession = useCallback(async () => {
    if (!sessionId) return
    try {
      setLoading(true)
      const [sessionData, participantsData, votesData] = await Promise.all([
        getVotingSession(sessionId),
        getSessionParticipants(sessionId),
        getSessionVotes(sessionId)
      ])
      setSession(sessionData)
      setParticipants(participantsData)
      setVotes(votesData)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching session:', err)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    fetchSession()

    if (!sessionId) return

    // Subscribe to participants changes
    const participantSub = subscribeToSessionParticipants(sessionId, (payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        setParticipants(prev => [...prev, payload.new])
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        setParticipants(prev => prev.map(p =>
          p.id === payload.new.id ? { ...p, ...payload.new } : p
        ))
      } else if (payload.eventType === 'DELETE' && payload.old?.id) {
        setParticipants(prev => prev.filter(p => p.id !== payload.old.id))
      }
    })

    // Subscribe to votes changes
    const votesSub = subscribeToSessionVotes(sessionId, (payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        setVotes(prev => [...prev.filter(v =>
          !(v.movie_id === payload.new.movie_id && v.user_name === payload.new.user_name)
        ), payload.new])
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        setVotes(prev => prev.map(v =>
          v.id === payload.new.id ? payload.new : v
        ))
      } else if (payload.eventType === 'DELETE' && payload.old?.id) {
        setVotes(prev => prev.filter(v => v.id !== payload.old.id))
      }
    })

    return () => {
      participantSub.unsubscribe()
      votesSub.unsubscribe()
    }
  }, [sessionId, fetchSession])

  // Cast a vote in this session
  const castVote = useCallback(async (movieId, userName, vote) => {
    try {
      const newVote = await castSessionVote(movieId, userName, vote, sessionId, authUserId)
      setVotes(prev => [
        ...prev.filter(v => !(v.movie_id === movieId && v.user_name === userName)),
        newVote
      ])
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [sessionId, authUserId])

  // Remove a vote
  const removeVote = useCallback(async (movieId, userName) => {
    try {
      await removeSessionVote(movieId, userName, sessionId)
      setVotes(prev => prev.filter(v =>
        !(v.movie_id === movieId && v.user_name === userName)
      ))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [sessionId])

  // Check if current user is the creator
  const isCreator = session?.created_by === authUserId

  // Check if current user has accepted
  const myParticipation = participants.find(p => p.user_id === authUserId)
  const hasAccepted = myParticipation?.status === 'accepted'

  return {
    session,
    participants,
    votes,
    loading,
    error,
    castVote,
    removeVote,
    isCreator,
    hasAccepted,
    myParticipation,
    refetch: fetchSession
  }
}
