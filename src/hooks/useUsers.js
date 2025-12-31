import { useState, useEffect, useCallback } from 'react'
import { getUsers, addUser as addUserDb, subscribeToUsers } from '../lib/database'

export function useUsers() {
  const [users, setUsers] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getUsers()
      setUsers(data)

      // Set initial current user from localStorage or first user
      const savedUser = localStorage.getItem('movienight-currentuser')
      if (savedUser && data.some(u => u.name === savedUser)) {
        setCurrentUser(savedUser)
      } else if (data.length > 0) {
        setCurrentUser(data[0].name)
      }

      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()

    // Subscribe to real-time updates
    const subscription = subscribeToUsers((payload) => {
      if (payload.eventType === 'INSERT') {
        setUsers(prev => [...prev, payload.new])
      } else if (payload.eventType === 'DELETE') {
        setUsers(prev => prev.filter(u => u.id !== payload.old.id))
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchUsers])

  const selectUser = useCallback((userName) => {
    setCurrentUser(userName)
    localStorage.setItem('movienight-currentuser', userName)
  }, [])

  const addUser = useCallback(async (name) => {
    try {
      const newUser = await addUserDb(name)
      return newUser
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  return {
    users,
    currentUser,
    loading,
    error,
    selectUser,
    addUser,
    refetch: fetchUsers
  }
}
