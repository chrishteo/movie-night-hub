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

export async function getMovies(page = 0) {
  const from = page * MOVIES_PER_PAGE
  const to = from + MOVIES_PER_PAGE - 1

  const { data, error, count } = await supabase
    .from('movies')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

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
      favorite: movie.favorite || false,
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
  // This prevents setting title to undefined or resetting watched/favorite
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
  if (updates.favorite !== undefined) updateData.favorite = updates.favorite
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

export async function toggleMovieFavorite(id, favorite) {
  const { data, error } = await supabase
    .from('movies')
    .update({ favorite })
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

// ============ MOVIE OF THE WEEK ============

export async function getMovieOfTheWeekHistory() {
  const { data, error } = await supabase
    .from('movie_of_the_week')
    .select('*')
    .order('picked_at', { ascending: false })
    .limit(20)

  if (error) throw error
  return data
}

export async function setMovieOfTheWeek(movie, pickedBy) {
  const { data, error } = await supabase
    .from('movie_of_the_week')
    .insert([{
      movie_id: movie.id,
      movie_title: movie.title,
      movie_poster: movie.poster || null,
      picked_by: pickedBy
    }])
    .select()
    .single()

  if (error) throw error
  return data
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

export function subscribeToMOTW(callback) {
  return supabase
    .channel('motw-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'movie_of_the_week' }, callback)
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

export async function createMovieNight(movieId, movieTitle, scheduledDate, notes = '', userId = null) {
  const { data, error } = await supabase
    .from('movie_nights')
    .insert([{
      movie_id: movieId,
      movie_title: movieTitle,
      scheduled_date: scheduledDate,
      notes,
      user_id: userId
    }])
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

export async function deleteMovieNight(id) {
  const { error } = await supabase
    .from('movie_nights')
    .delete()
    .eq('id', id)

  if (error) throw error
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
