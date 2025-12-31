import { useState, useEffect, useCallback } from 'react'
import {
  getVotes,
  castVote as castVoteDb,
  clearVotes as clearVotesDb,
  subscribeToVotes
} from '../lib/database'

export function useVotes() {
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
      if (payload.eventType === 'INSERT') {
        setVotes(prev => [...prev.filter(v =>
          !(v.movie_id === payload.new.movie_id && v.user_name === payload.new.user_name)
        ), payload.new])
      } else if (payload.eventType === 'UPDATE') {
        setVotes(prev => prev.map(v =>
          v.id === payload.new.id ? payload.new : v
        ))
      } else if (payload.eventType === 'DELETE') {
        setVotes(prev => prev.filter(v => v.id !== payload.old.id))
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchVotes])

  const castVote = useCallback(async (movieId, userName, vote) => {
    try {
      await castVoteDb(movieId, userName, vote)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

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
    clearAllVotes,
    refetch: fetchVotes
  }
}
