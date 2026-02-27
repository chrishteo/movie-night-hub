import { supabase } from './supabase'

// ============ USERS ============

export async function getUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function addUser(name, avatar = '😊', authId = null) {
  const { data, error } = await supabase
    .from('users')
    .insert([{ name, avatar, auth_id: authId }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getUserByAuthId(authId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authId)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows found
  return data
}

export async function linkUserToAuth(userId, authId) {
  const { data, error } = await supabase
    .from('users')
    .update({ auth_id: authId })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateUser(id, updates) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteUser(id) {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============ MOVIES ============

const MOVIES_PER_PAGE = 50

// Fetch all movies without pagination (for features like SpinWheel, Voting)
export async function getAllMovies() {
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getMovies(page = 0, filters = {}) {
  const from = page * MOVIES_PER_PAGE
  const to = from + MOVIES_PER_PAGE - 1

  let query = supabase
    .from('movies')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  // Apply server-side filters
  if (filters.addedBy) {
    query = query.eq('added_by', filters.addedBy)
  }

  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error
  return {
    movies: data,
    hasMore: count > to + 1,
    total: count
  }
}

export async function addMovie(movie, userId = null) {
  const { data, error } = await supabase
    .from('movies')
    .insert([{
      title: movie.title,
      director: movie.director || null,
      year: movie.year || null,
      genre: movie.genre || null,
      mood: movie.mood || null,
      rating: movie.rating || 0,
      poster: movie.poster || null,
      streaming: movie.streaming || [],
      watched: movie.watched || false,
      watched_at: movie.watched_at || null,
      notes: movie.notes || null,
      added_by: movie.added_by,
      user_id: userId, // Link to authenticated user
      trailer_url: movie.trailer_url || null,
      tmdb_rating: movie.tmdb_rating || null,
      "cast": movie.cast || [],
      imdb_rating: movie.imdb_rating || null,
      rotten_tomatoes: movie.rotten_tomatoes || null
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateMovie(id, updates) {
  // Build update object with only the fields that are provided
  // This prevents setting title to undefined or resetting watched
  const updateData = {}

  // Only include fields that are explicitly in the updates object
  if (updates.title !== undefined) updateData.title = updates.title
  if (updates.director !== undefined) updateData.director = updates.director || null
  if (updates.year !== undefined) updateData.year = updates.year || null
  if (updates.genre !== undefined) updateData.genre = updates.genre || null
  if (updates.mood !== undefined) updateData.mood = updates.mood || null
  if (updates.rating !== undefined) updateData.rating = updates.rating
  if (updates.poster !== undefined) updateData.poster = updates.poster || null
  if (updates.streaming !== undefined) updateData.streaming = updates.streaming || []
  if (updates.watched !== undefined) updateData.watched = updates.watched
  if (updates.watched_at !== undefined) updateData.watched_at = updates.watched_at
  if (updates.notes !== undefined) updateData.notes = updates.notes || null

  const { data, error } = await supabase
    .from('movies')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteMovie(id) {
  const { error } = await supabase
    .from('movies')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function toggleMovieWatched(id, watched) {
  const { data, error } = await supabase
    .from('movies')
    .update({
      watched,
      watched_at: watched ? new Date().toISOString() : null
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============ VOTES ============

export async function getVotes() {
  const { data, error } = await supabase
    .from('votes')
    .select('*')

  if (error) throw error
  return data
}

export async function castVote(movieId, userName, vote, userId = null) {
  // If userId provided, use secure user_id based voting
  // Otherwise fall back to user_name (legacy/unauthenticated)
  const voteData = {
    movie_id: movieId,
    user_name: userName,
    vote
  }

  if (userId) {
    voteData.user_id = userId
  }

  const { data, error } = await supabase
    .from('votes')
    .upsert([voteData], {
      // Use user_id if available, otherwise fall back to user_name
      onConflict: userId ? 'movie_id,user_id' : 'movie_id,user_name'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function clearVotes() {
  const { error } = await supabase
    .from('votes')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

  if (error) throw error
}

export async function removeVote(movieId, userName, userId = null) {
  let query = supabase.from('votes').delete()

  if (userId) {
    query = query.eq('movie_id', movieId).eq('user_id', userId)
  } else {
    query = query.eq('movie_id', movieId).eq('user_name', userName)
  }

  const { error } = await query
  if (error) throw error
}

// ============ REAL-TIME SUBSCRIPTIONS ============

export function subscribeToMovies(callback) {
  return supabase
    .channel('movies-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'movies' }, callback)
    .subscribe()
}

export function subscribeToVotes(callback) {
  return supabase
    .channel('votes-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, callback)
    .subscribe()
}

export function subscribeToUsers(callback) {
  return supabase
    .channel('users-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, callback)
    .subscribe()
}

// ============ COLLECTIONS ============

export async function getCollections() {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createCollection(name, emoji = '📁', color = 'purple', userId = null) {
  const { data, error } = await supabase
    .from('collections')
    .insert([{ name, emoji, color, user_id: userId }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCollection(id, updates) {
  const { data, error } = await supabase
    .from('collections')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCollection(id) {
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getCollectionMovies(collectionId) {
  const { data, error } = await supabase
    .from('collection_movies')
    .select('movie_id')
    .eq('collection_id', collectionId)

  if (error) throw error
  return data.map(cm => cm.movie_id)
}

export async function addMovieToCollection(collectionId, movieId) {
  const { data, error } = await supabase
    .from('collection_movies')
    .insert([{ collection_id: collectionId, movie_id: movieId }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function removeMovieFromCollection(collectionId, movieId) {
  const { error } = await supabase
    .from('collection_movies')
    .delete()
    .eq('collection_id', collectionId)
    .eq('movie_id', movieId)

  if (error) throw error
}

// ============ COLLECTION SHARING ============

export async function getCollectionShares(collectionId) {
  const { data, error } = await supabase
    .from('collection_shares')
    .select(`
      id,
      can_edit,
      created_at,
      shared_with_user_id,
      users:shared_with_user_id (id, name, avatar)
    `)
    .eq('collection_id', collectionId)

  if (error) throw error
  return data
}

export async function shareCollection(collectionId, userId, canEdit = false, ownerAuthId) {
  const { data, error } = await supabase
    .from('collection_shares')
    .insert([{
      collection_id: collectionId,
      shared_with_user_id: userId,
      can_edit: canEdit,
      owner_id: ownerAuthId
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCollectionShare(shareId, canEdit) {
  const { data, error } = await supabase
    .from('collection_shares')
    .update({ can_edit: canEdit })
    .eq('id', shareId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function removeCollectionShare(shareId) {
  const { error } = await supabase
    .from('collection_shares')
    .delete()
    .eq('id', shareId)

  if (error) throw error
}

// Check if user can edit a collection (owner or has edit permission)
export async function canEditCollection(collectionId, authUserId) {
  // First check if user is owner
  const { data: collection, error: collError } = await supabase
    .from('collections')
    .select('user_id')
    .eq('id', collectionId)
    .single()

  if (collError) return false
  if (collection.user_id === authUserId) return true

  // Check if user has edit permission via share
  const { data: share, error: shareError } = await supabase
    .from('collection_shares')
    .select('can_edit')
    .eq('collection_id', collectionId)
    .eq('shared_with_user_id', authUserId)
    .single()

  if (shareError) return false
  return share?.can_edit === true
}

// ============ MOVIE NIGHTS ============

export async function getMovieNights() {
  const { data, error } = await supabase
    .from('movie_nights')
    .select('*')
    .order('scheduled_date', { ascending: true })

  if (error) throw error
  return data
}

export async function createMovieNight(movieId, movieTitle, scheduledDate, notes = '', userId = null, scheduledTime = null) {
  const insertData = {
    movie_id: movieId,
    movie_title: movieTitle,
    scheduled_date: scheduledDate,
    notes,
    user_id: userId
  }

  if (scheduledTime) {
    insertData.scheduled_time = scheduledTime
  }

  const { data, error } = await supabase
    .from('movie_nights')
    .insert([insertData])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateMovieNight(id, updates) {
  const { data, error } = await supabase
    .from('movie_nights')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteMovieNight(id, isAdmin = false) {
  const { data, error } = await supabase
    .from('movie_nights')
    .delete()
    .eq('id', id)
    .select()

  if (error) throw error

  // Check if deletion actually happened (RLS may silently block it)
  if (!data || data.length === 0) {
    throw new Error('Unable to delete movie night. You may not have permission.')
  }
}

// ============ ADMIN ============

export async function checkIsAdmin(authId) {
  if (!authId) return false

  const { data, error } = await supabase
    .from('users')
    .select('is_admin')
    .eq('auth_id', authId)
    .single()

  if (error) return false
  return data?.is_admin === true
}

export async function setUserAdmin(userId, isAdmin) {
  const { data, error } = await supabase
    .from('users')
    .update({ is_admin: isAdmin })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteUserAsAdmin(userId) {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId)

  if (error) throw error
}

export async function deleteMovieAsAdmin(movieId) {
  const { error } = await supabase
    .from('movies')
    .delete()
    .eq('id', movieId)

  if (error) throw error
}

// ============ ANNOUNCEMENTS ============

export async function getAnnouncements(activeOnly = true) {
  let query = supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })

  if (activeOnly) {
    query = query.eq('active', true)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function createAnnouncement(title, message, type = 'info', expiresAt = null, createdBy = null) {
  const { data, error } = await supabase
    .from('announcements')
    .insert([{
      title,
      message,
      type,
      expires_at: expiresAt,
      created_by: createdBy
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateAnnouncement(id, updates) {
  const { data, error } = await supabase
    .from('announcements')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteAnnouncement(id) {
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============ BUG REPORTS ============

export async function getBugReports(userId = null) {
  let query = supabase
    .from('bug_reports')
    .select('*')
    .order('created_at', { ascending: false })

  // If userId provided, filter to that user's reports (for non-admins)
  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function createBugReport(title, description, userId = null, userName = null) {
  const { data, error } = await supabase
    .from('bug_reports')
    .insert([{
      title,
      description,
      user_id: userId,
      user_name: userName
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateBugReport(id, updates) {
  const updateData = { ...updates }

  // Set resolved_at when status changes to resolved or closed
  if (updates.status === 'resolved' || updates.status === 'closed') {
    updateData.resolved_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('bug_reports')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteBugReport(id) {
  const { error } = await supabase
    .from('bug_reports')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export function subscribeToAnnouncements(callback) {
  return supabase
    .channel('announcements-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, callback)
    .subscribe()
}

// ============ CHANGELOG ============

export async function getChangelog(limit = 20) {
  const { data, error } = await supabase
    .from('changelog')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export async function createChangelogEntry(title, description, type = 'feature', version = null, createdBy = null) {
  const { data, error } = await supabase
    .from('changelog')
    .insert([{
      title,
      description,
      type,
      version,
      created_by: createdBy
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateChangelogEntry(id, updates) {
  const { data, error } = await supabase
    .from('changelog')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteChangelogEntry(id) {
  const { error } = await supabase
    .from('changelog')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export function subscribeToChangelog(callback) {
  return supabase
    .channel('changelog-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'changelog' }, callback)
    .subscribe()
}

// ============ USER MOVIE STATUS (Per-User Watched/Rating) ============

export async function getUserMovieStatuses(userId) {
  const { data, error } = await supabase
    .from('user_movie_status')
    .select('*')
    .eq('user_id', userId)

  if (error) throw error
  return data
}

export async function getAllMovieStatuses() {
  const { data, error } = await supabase
    .from('user_movie_status')
    .select('*')

  if (error) throw error
  return data
}

export async function setUserMovieStatus(movieId, userId, updates) {
  const statusData = {
    movie_id: movieId,
    user_id: userId
  }

  // Include provided fields
  if (updates.watched !== undefined) {
    statusData.watched = updates.watched
    statusData.watched_at = updates.watched ? new Date().toISOString() : null
  }
  if (updates.rating !== undefined) {
    statusData.rating = updates.rating
  }
  if (updates.acknowledged !== undefined) {
    statusData.acknowledged = updates.acknowledged
  }
  if (updates.interested !== undefined) {
    statusData.interested = updates.interested
  }

  const { data, error } = await supabase
    .from('user_movie_status')
    .upsert([statusData], { onConflict: 'movie_id,user_id' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getUserMovieStatus(movieId, userId) {
  const { data, error } = await supabase
    .from('user_movie_status')
    .select('*')
    .eq('movie_id', movieId)
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows found
  return data
}

export function subscribeToUserMovieStatuses(callback) {
  return supabase
    .channel('user-movie-status-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'user_movie_status' }, callback)
    .subscribe()
}

// ============ MOVIE NIGHTS (Enhanced with Participants) ============

export async function completeMovieNight(movieNightId, movieId, participantUserIds) {
  // Update movie night as completed
  const { data: movieNight, error: mnError } = await supabase
    .from('movie_nights')
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
      participants: participantUserIds
    })
    .eq('id', movieNightId)
    .select()
    .single()

  if (mnError) throw mnError

  // Auto-mark all participants as having watched the movie
  const statusPromises = participantUserIds.map(userId =>
    setUserMovieStatus(movieId, userId, { watched: true })
  )

  await Promise.all(statusPromises)

  return movieNight
}

export async function getMovieNightHistory() {
  const { data, error } = await supabase
    .from('movie_nights')
    .select('*')
    .eq('completed', true)
    .order('completed_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data
}

// ============ WATCH INVITES ============

export async function getMyInvites(userId) {
  // Get invites where I am the invitee (to show in my inbox)
  const { data, error } = await supabase
    .from('watch_invites')
    .select(`
      *,
      movies:movie_id (id, title, poster, year, director)
    `)
    .eq('invitee_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getPendingInviteCount(userId) {
  const { count, error } = await supabase
    .from('watch_invites')
    .select('*', { count: 'exact', head: true })
    .eq('invitee_id', userId)
    .eq('status', 'pending')

  if (error) throw error
  return count || 0
}

export async function sendWatchInvites(movieId, inviterId, inviteeIds) {
  // Send invites to multiple users at once
  const invites = inviteeIds.map(inviteeId => ({
    movie_id: movieId,
    inviter_id: inviterId,
    invitee_id: inviteeId,
    status: 'pending'
  }))

  const { data, error } = await supabase
    .from('watch_invites')
    .upsert(invites, { onConflict: 'movie_id,invitee_id' })
    .select()

  if (error) throw error
  return data
}

export async function respondToInvite(inviteId, response) {
  // response should be 'accepted' or 'declined'
  const { data, error } = await supabase
    .from('watch_invites')
    .update({
      status: response,
      responded_at: new Date().toISOString()
    })
    .eq('id', inviteId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function cancelInvite(inviteId) {
  const { error } = await supabase
    .from('watch_invites')
    .delete()
    .eq('id', inviteId)

  if (error) throw error
}

export function subscribeToWatchInvites(userId, callback) {
  return supabase
    .channel(`watch-invites-${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'watch_invites',
      filter: `invitee_id=eq.${userId}`
    }, callback)
    .subscribe()
}

// ============ VOTING SESSIONS ============

export async function getVotingSessions(activeOnly = false) {
  let query = supabase
    .from('voting_sessions')
    .select('*')
    .order('created_at', { ascending: false })

  if (activeOnly) {
    query = query.eq('status', 'active')
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getVotingSession(sessionId) {
  const { data, error } = await supabase
    .from('voting_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error) throw error
  return data
}

export async function createVotingSession(name, createdBy, moviesPerUser = 5) {
  const { data, error } = await supabase
    .from('voting_sessions')
    .insert([{ name, created_by: createdBy, movies_per_user: moviesPerUser }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateVotingSession(sessionId, updates) {
  const { data, error } = await supabase
    .from('voting_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function endVotingSession(sessionId, winnerMovieId = null) {
  const { data, error } = await supabase
    .from('voting_sessions')
    .update({
      status: 'completed',
      ended_at: new Date().toISOString(),
      winner_movie_id: winnerMovieId
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function cancelVotingSession(sessionId) {
  const { data, error } = await supabase
    .from('voting_sessions')
    .update({
      status: 'cancelled',
      ended_at: new Date().toISOString()
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteVotingSession(sessionId) {
  const { error } = await supabase
    .from('voting_sessions')
    .delete()
    .eq('id', sessionId)

  if (error) throw error
}

// ============ VOTING SESSION PARTICIPANTS ============

export async function getSessionParticipants(sessionId) {
  const { data, error } = await supabase
    .from('voting_session_participants')
    .select('*')
    .eq('session_id', sessionId)

  if (error) throw error
  return data
}

export async function addSessionParticipants(sessionId, userIds) {
  const participants = userIds.map(userId => ({
    session_id: sessionId,
    user_id: userId,
    status: 'invited'
  }))

  const { data, error } = await supabase
    .from('voting_session_participants')
    .upsert(participants, { onConflict: 'session_id,user_id' })
    .select()

  if (error) throw error
  return data
}

export async function updateParticipantStatus(sessionId, userId, status) {
  const { data, error } = await supabase
    .from('voting_session_participants')
    .update({
      status,
      responded_at: new Date().toISOString()
    })
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function removeSessionParticipant(sessionId, userId) {
  const { error } = await supabase
    .from('voting_session_participants')
    .delete()
    .eq('session_id', sessionId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function getMySessionInvites(userId) {
  const { data, error } = await supabase
    .from('voting_session_participants')
    .select(`
      *,
      session:session_id (id, name, status, created_at, created_by)
    `)
    .eq('user_id', userId)

  if (error) throw error
  // Filter to only active sessions, and exclude sessions where user is the creator
  // (creator should never see their own session as an invite)
  return data.filter(p =>
    p.session?.status === 'active' &&
    p.session?.created_by !== userId
  )
}

// Get only pending invites (for notification badge)
export async function getMyPendingInvites(userId) {
  const { data, error } = await supabase
    .from('voting_session_participants')
    .select(`
      *,
      session:session_id (id, name, status, created_at, created_by)
    `)
    .eq('user_id', userId)
    .eq('status', 'invited')

  if (error) throw error
  // Filter to only active sessions, and exclude sessions where user is the creator
  return data.filter(p =>
    p.session?.status === 'active' &&
    p.session?.created_by !== userId
  )
}

export async function leaveVotingSession(sessionId, userId) {
  // Update status to 'declined' (leaving = no longer participating)
  const { data, error } = await supabase
    .from('voting_session_participants')
    .update({
      status: 'declined',
      responded_at: new Date().toISOString()
    })
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function checkAndAutoCloseSession(sessionId) {
  // Get all participants for this session
  const { data: participants, error: pError } = await supabase
    .from('voting_session_participants')
    .select('*')
    .eq('session_id', sessionId)

  if (pError) throw pError

  // Get the session to find the creator
  const { data: session, error: sError } = await supabase
    .from('voting_sessions')
    .select('created_by, status')
    .eq('id', sessionId)
    .single()

  if (sError) throw sError

  // If session is already closed, don't do anything
  if (session.status !== 'active') return null

  // Check if any non-creator participant is still accepted or invited
  const hasActiveParticipants = participants.some(p =>
    p.user_id !== session.created_by &&
    (p.status === 'accepted' || p.status === 'invited')
  )

  // If no active participants left, auto-close the session
  if (!hasActiveParticipants) {
    const { data, error } = await supabase
      .from('voting_sessions')
      .update({
        status: 'cancelled',
        ended_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) {
      // If RLS blocks the update, that's okay - session stays open
      return null
    }
    return data // Return the closed session
  }

  return null // Session stays open
}

export async function getPendingSessionInviteCount(userId) {
  const invites = await getMySessionInvites(userId)
  return invites.length
}

// ============ VOTES (Updated for Sessions) ============

export async function getSessionVotes(sessionId) {
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('session_id', sessionId)

  if (error) throw error
  return data
}

export async function castSessionVote(movieId, userName, vote, sessionId, authUserId = null) {
  const voteData = {
    movie_id: movieId,
    user_name: userName,
    vote,
    session_id: sessionId
  }

  if (authUserId) {
    voteData.user_id = authUserId
  }

  const { data, error } = await supabase
    .from('votes')
    .upsert([voteData], { onConflict: 'movie_id,user_name,session_id' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function removeSessionVote(movieId, userName, sessionId) {
  const { error } = await supabase
    .from('votes')
    .delete()
    .eq('movie_id', movieId)
    .eq('user_name', userName)
    .eq('session_id', sessionId)

  if (error) throw error
}

export async function clearSessionVotes(sessionId) {
  const { error } = await supabase
    .from('votes')
    .delete()
    .eq('session_id', sessionId)

  if (error) throw error
}

// ============ VOTING SESSIONS SUBSCRIPTIONS ============

export function subscribeToVotingSessions(callback) {
  return supabase
    .channel('voting-sessions-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'voting_sessions' }, callback)
    .subscribe()
}

export function subscribeToSessionParticipants(sessionId, callback) {
  return supabase
    .channel(`session-participants-${sessionId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'voting_session_participants',
      filter: `session_id=eq.${sessionId}`
    }, callback)
    .subscribe()
}

export function subscribeToSessionVotes(sessionId, callback) {
  return supabase
    .channel(`session-votes-${sessionId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'votes',
      filter: `session_id=eq.${sessionId}`
    }, callback)
    .subscribe()
}

// ============ VOTING SESSION MOVIES (User Picks) ============

export async function getSessionMovies(sessionId) {
  const { data, error } = await supabase
    .from('voting_session_movies')
    .select('*')
    .eq('session_id', sessionId)

  if (error) throw error
  return data
}

export async function addSessionMovies(sessionId, movieIds, userId) {
  const movies = movieIds.map(movieId => ({
    session_id: sessionId,
    movie_id: movieId,
    selected_by: userId
  }))

  const { data, error } = await supabase
    .from('voting_session_movies')
    .upsert(movies, { onConflict: 'session_id,movie_id' })
    .select()

  if (error) throw error
  return data
}

export async function removeSessionMovie(sessionId, movieId) {
  const { error } = await supabase
    .from('voting_session_movies')
    .delete()
    .eq('session_id', sessionId)
    .eq('movie_id', movieId)

  if (error) throw error
}

export async function clearSessionMovies(sessionId, userId) {
  // Clear all movies selected by a specific user in a session
  const { error } = await supabase
    .from('voting_session_movies')
    .delete()
    .eq('session_id', sessionId)
    .eq('selected_by', userId)

  if (error) throw error
}

export function subscribeToSessionMovies(sessionId, callback) {
  return supabase
    .channel(`session-movies-${sessionId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'voting_session_movies',
      filter: `session_id=eq.${sessionId}`
    }, callback)
    .subscribe()
}

// ============ APP SETTINGS ============

export async function getLatestVersion() {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'latest_version')
    .single()

  if (error) {
    console.error('Error fetching latest version:', error)
    return null
  }
  return data?.value || null
}

// ============ FRIENDSHIPS ============

export async function getFriends(userId) {
  // Get all accepted friendships for a user
  // The friendships view is bidirectional, so this returns all friends
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      friend_id,
      created_at,
      friend:friend_id (id, name, avatar, is_admin)
    `)
    .eq('user_id', userId)

  if (error) throw error
  return data
}

export async function getPendingFriendRequests(userId) {
  // Get friend requests where I am the receiver and status is pending
  const { data, error } = await supabase
    .from('friend_requests')
    .select(`
      *,
      sender:sender_id (id, name, avatar)
    `)
    .eq('receiver_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getSentFriendRequests(userId) {
  // Get friend requests I have sent that are still pending
  const { data, error } = await supabase
    .from('friend_requests')
    .select(`
      *,
      receiver:receiver_id (id, name, avatar)
    `)
    .eq('sender_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function sendFriendRequest(senderId, receiverId) {
  const { data, error } = await supabase
    .from('friend_requests')
    .insert([{
      sender_id: senderId,
      receiver_id: receiverId,
      status: 'pending'
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function respondToFriendRequest(requestId, accept) {
  const { data, error } = await supabase
    .from('friend_requests')
    .update({
      status: accept ? 'accepted' : 'rejected',
      responded_at: new Date().toISOString()
    })
    .eq('id', requestId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function cancelFriendRequest(requestId) {
  const { error } = await supabase
    .from('friend_requests')
    .delete()
    .eq('id', requestId)

  if (error) throw error
}

export async function removeFriend(userId, friendId) {
  // Delete the friend_request row (works for both directions due to RLS)
  // First try where user is sender
  let { error } = await supabase
    .from('friend_requests')
    .delete()
    .eq('sender_id', userId)
    .eq('receiver_id', friendId)
    .eq('status', 'accepted')

  if (error) {
    // Try the other direction
    const { error: error2 } = await supabase
      .from('friend_requests')
      .delete()
      .eq('sender_id', friendId)
      .eq('receiver_id', userId)
      .eq('status', 'accepted')

    if (error2) throw error2
  }
}

export async function getFriendshipStatus(userId, otherUserId) {
  // Check if there's any friend request between these two users
  const { data, error } = await supabase
    .from('friend_requests')
    .select('*')
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows found

  if (!data) return { status: 'none' }

  if (data.status === 'accepted') return { status: 'friends', request: data }
  if (data.status === 'pending') {
    if (data.sender_id === userId) {
      return { status: 'pending_sent', request: data }
    } else {
      return { status: 'pending_received', request: data }
    }
  }
  return { status: 'none' }
}

export async function getPendingFriendRequestCount(userId) {
  const { count, error } = await supabase
    .from('friend_requests')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .eq('status', 'pending')

  if (error) throw error
  return count || 0
}

export async function searchUsersForFriendRequest(query, currentUserId) {
  // Search for users by name, excluding current user
  const { data, error } = await supabase
    .from('users')
    .select('id, name, avatar')
    .neq('id', currentUserId)
    .ilike('name', `%${query}%`)
    .limit(10)

  if (error) throw error
  return data
}

export function subscribeToFriendRequests(userId, callback) {
  return supabase
    .channel(`friend-requests-${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'friend_requests',
      filter: `receiver_id=eq.${userId}`
    }, callback)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'friend_requests',
      filter: `sender_id=eq.${userId}`
    }, callback)
    .subscribe()
}
