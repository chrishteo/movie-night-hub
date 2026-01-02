import { useState, useEffect, useCallback } from 'react'
import {
  getVotes,
  castVote as castVoteDb,
  removeVote as removeVoteDb,
  clearVotes as clearVotesDb,
  subscribeToVotes
} from '../lib/database'

export function useVotes(authUserId = null) {
  const [votes, setVotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchVotes = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getVotes()
      setVotes(data)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching votes:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVotes()

    // Subscribe to real-time updates
    const subscription = subscribeToVotes((payload) => {
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
      subscription.unsubscribe()
    }
  }, [fetchVotes])

  const castVote = useCallback(async (movieId, userName, vote) => {
    try {
      // Pass authUserId for RLS security
      const newVote = await castVoteDb(movieId, userName, vote, authUserId)
      // Update local state - use user_id if available, otherwise user_name
      setVotes(prev => [
        ...prev.filter(v => {
          if (authUserId && v.user_id) {
            return !(v.movie_id === movieId && v.user_id === authUserId)
          }
          return !(v.movie_id === movieId && v.user_name === userName)
        }),
        newVote
      ])
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [authUserId])

  const removeVote = useCallback(async (movieId, userName) => {
    try {
      await removeVoteDb(movieId, userName, authUserId)
      // Update local state
      setVotes(prev => prev.filter(v => {
        if (authUserId && v.user_id) {
          return !(v.movie_id === movieId && v.user_id === authUserId)
        }
        return !(v.movie_id === movieId && v.user_name === userName)
      }))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [authUserId])

  const clearAllVotes = useCallback(async () => {
    try {
      await clearVotesDb()
      setVotes([])
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  return {
    votes,
    loading,
    error,
    castVote,
    removeVote,
    clearAllVotes,
    refetch: fetchVotes
  }
}
