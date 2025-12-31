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

export async function addUser(name, avatar = '😊') {
  const { data, error } = await supabase
    .from('users')
    .insert([{ name, avatar }])
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

export async function getMovies() {
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function addMovie(movie) {
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
  const { data, error } = await supabase
    .from('movies')
    .update({
      title: updates.title,
      director: updates.director || null,
      year: updates.year || null,
      genre: updates.genre || null,
      mood: updates.mood || null,
      rating: updates.rating || 0,
      poster: updates.poster || null,
      streaming: updates.streaming || [],
      watched: updates.watched || false,
      watched_at: updates.watched_at || null,
      favorite: updates.favorite || false,
      notes: updates.notes || null
    })
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

export async function castVote(movieId, userName, vote) {
  const { data, error } = await supabase
    .from('votes')
    .upsert([{
      movie_id: movieId,
      user_name: userName,
      vote
    }], {
      onConflict: 'movie_id,user_name'
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

export async function createCollection(name, emoji = '📁', color = 'purple') {
  const { data, error } = await supabase
    .from('collections')
    .insert([{ name, emoji, color }])
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

// ============ MOVIE NIGHTS ============

export async function getMovieNights() {
  const { data, error } = await supabase
    .from('movie_nights')
    .select('*')
    .order('scheduled_date', { ascending: true })

  if (error) throw error
  return data
}

export async function createMovieNight(movieId, movieTitle, scheduledDate, notes = '') {
  const { data, error } = await supabase
    .from('movie_nights')
    .insert([{
      movie_id: movieId,
      movie_title: movieTitle,
      scheduled_date: scheduledDate,
      notes
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
