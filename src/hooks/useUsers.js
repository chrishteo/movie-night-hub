import { useState, useEffect, useCallback } from 'react'
import {
  getUsers,
  addUser as addUserDb,
  updateUser as updateUserDb,
  deleteUser as deleteUserDb,
  getUserByAuthId,
  linkUserToAuth,
  subscribeToUsers
} from '../lib/database'

export function useUsers(authUser = null) {
  const [users, setUsers] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getUsers()
      setUsers(data)

      // If we have an auth user, try to find or create their profile
      if (authUser?.id) {
        // First check if there's a profile linked to this auth user
        let linkedUser = await getUserByAuthId(authUser.id)

        if (linkedUser) {
          // Found linked profile, use it
          setCurrentUser(linkedUser.name)
          localStorage.setItem('movienight-currentuser', linkedUser.name)
        } else {
          // No linked profile - check if there's one with matching name
          const displayName = authUser.user_metadata?.display_name || authUser.email?.split('@')[0] || 'User'
          const matchingUser = data.find(u => u.name.toLowerCase() === displayName.toLowerCase())

          if (matchingUser) {
            // Link existing profile to auth user
            await linkUserToAuth(matchingUser.id, authUser.id)
            setCurrentUser(matchingUser.name)
            localStorage.setItem('movienight-currentuser', matchingUser.name)
            // Update local state with linked user
            setUsers(prev => prev.map(u => u.id === matchingUser.id ? { ...u, auth_id: authUser.id } : u))
          } else {
            // Create new profile for this auth user
            const newUser = await addUserDb(displayName, '😊', authUser.id)
            setUsers(prev => [...prev, newUser])
            setCurrentUser(newUser.name)
            localStorage.setItem('movienight-currentuser', newUser.name)
          }
        }
      } else {
        // No auth user - fall back to localStorage or first user
        const savedUser = localStorage.getItem('movienight-currentuser')
        if (savedUser && data.some(u => u.name === savedUser)) {
          setCurrentUser(savedUser)
        } else if (data.length > 0) {
          setCurrentUser(data[0].name)
        }
      }

      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }, [authUser?.id])

  useEffect(() => {
    fetchUsers()

    // Subscribe to real-time updates
    const subscription = subscribeToUsers((payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        setUsers(prev => [...prev, payload.new])
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        setUsers(prev => prev.map(u => u.id === payload.new.id ? payload.new : u))
      } else if (payload.eventType === 'DELETE' && payload.old?.id) {
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
