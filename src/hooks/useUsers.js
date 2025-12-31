import { useState, useEffect, useCallback } from 'react'
import { getUsers, addUser as addUserDb, updateUser as updateUserDb, deleteUser as deleteUserDb, subscribeToUsers } from '../lib/database'

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

  const addUser = useCallback(async (name, avatar = '😊') => {
    try {
      const newUser = await addUserDb(name, avatar)
      setUsers(prev => [...prev, newUser])
      return newUser
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const updateUser = useCallback(async (id, updates) => {
    try {
      const updatedUser = await updateUserDb(id, updates)
      setUsers(prev => prev.map(u => u.id === id ? updatedUser : u))
      return updatedUser
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const deleteUser = useCallback(async (id, userName) => {
    try {
      await deleteUserDb(id)
      setUsers(prev => prev.filter(u => u.id !== id))
      // If deleting current user, switch to first remaining user
      if (currentUser === userName) {
        const remaining = users.filter(u => u.id !== id)
        if (remaining.length > 0) {
          setCurrentUser(remaining[0].name)
          localStorage.setItem('movienight-currentuser', remaining[0].name)
        }
      }
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [currentUser, users])

  return {
    users,
    currentUser,
    loading,
    error,
    selectUser,
    addUser,
    updateUser,
    deleteUser,
    refetch: fetchUsers
  }
}
