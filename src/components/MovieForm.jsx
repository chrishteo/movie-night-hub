import { useState, useEffect, useCallback } from 'react'
import { GENRES, MOODS, STREAMING } from '../utils/constants'
import { searchMovie, searchTMDB, enrichMovieWithAI, checkAIStatus } from '../lib/api'

export default function MovieForm({
  movie,
  onSave,
  onClose,
  title,
  isEdit,
  darkMode
}) {
  const [formData, setFormData] = useState({
    title: movie?.title || '',
    director: movie?.director || '',
    genre: movie?.genre || '',
    year: movie?.year || '',
    mood: movie?.mood || '',
    poster: movie?.poster || '',
    streaming: movie?.streaming || [],
    rating: movie?.rating || 0,
    notes: movie?.notes || '',
    watched: movie?.watched || false,
    watched_at: movie?.watched_at || null,
    favorite: movie?.favorite || false,
    trailer_url: movie?.trailer_url || '',
    tmdb_rating: movie?.tmdb_rating || null,
    cast: movie?.cast || [],
    imdb_rating: movie?.imdb_rating || null,
    rotten_tomatoes: movie?.rotten_tomatoes || null
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [searchError, setSearchError] = useState('')

  // AI status state
  const [aiPending, setAiPending] = useState(false)
  const [aiAvailable, setAiAvailable] = useState(true)
  const [enrichingAI, setEnrichingAI] = useState(false)

  // Check AI status on mount
  useEffect(() => {
    checkAIStatus().then(status => {
      setAiAvailable(status.ai_available)
    })
  }, [])

  // Background AI enrichment
  const tryEnrichWithAI = useCallback(async (movieTitle) => {
    if (enrichingAI) return

    setEnrichingAI(true)
    try {
      const result = await enrichMovieWithAI(movieTitle)
      if (result.success && result.data) {
        setFormData(prev => ({
          ...prev,
          genre: result.data.genre || prev.genre,
          mood: result.data.mood || prev.mood,
          streaming: result.data.streaming?.length ? result.data.streaming : prev.streaming
        }))
        setAiPending(false)
        setAiAvailable(true)
      } else if (result.rateLimited) {
        setAiAvailable(false)
        // Schedule retry
        setTimeout(() => {
          setAiAvailable(true)
          tryEnrichWithAI(movieTitle)
        }, (result.retryAfterSeconds || 60) * 1000)
      }
    } catch (err) {
      console.error('AI enrichment failed:', err)
    } finally {
      setEnrichingAI(false)
    }
  }, [enrichingAI])

  // Step 1: Search TMDB for multiple results
  const handleQuickSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    setSearchError('')
    setSearchResults([])

    try {
      const results = await searchTMDB(searchQuery)
      if (results.length === 0) {
        setSearchError('No movies found. Try a different search.')
      } else {
        setSearchResults(results)
      }
    } catch (err) {
      setSearchError(err.message || 'Search failed.')
    } finally {
      setSearching(false)
    }
  }

  // Step 2: User picks a movie, fetch full details
  const handleSelectMovie = async (movie) => {
    setSearchResults([])
    setLoadingDetails(true)
    setSearchError('')
    setAiPending(false)

    try {
      // Use TMDB ID for exact match, fallback to title search
      const searchTitle = movie.year ? `${movie.title} ${movie.year}` : movie.title
      const info = await searchMovie(searchTitle, movie.tmdb_id)

      setFormData(prev => ({
        ...prev,
        title: info.title || movie.title,
        director: info.director || prev.director,
        year: info.year || movie.year || prev.year,
        genre: info.genre || prev.genre,
        mood: info.mood || prev.mood,
        poster: info.poster || movie.poster || prev.poster,
        streaming: info.streaming?.length ? info.streaming : prev.streaming,
        trailer_url: info.trailer_url || prev.trailer_url,
        tmdb_rating: info.tmdb_rating || prev.tmdb_rating,
        cast: info.cast?.length ? info.cast : prev.cast,
        imdb_rating: info.imdb_rating || prev.imdb_rating,
        rotten_tomatoes: info.rotten_tomatoes || prev.rotten_tomatoes
      }))

      // Handle AI pending state
      if (info.ai_pending) {
        setAiPending(true)
        setAiAvailable(!info.ai_unavailable)

        // Start background enrichment if AI is available
        if (!info.ai_unavailable) {
          setTimeout(() => tryEnrichWithAI(info.title || movie.title), 2000)
        } else {
          // Schedule retry after cooldown
          const retryAfter = (info.retry_after_seconds || 60) * 1000
          setTimeout(() => {
            setAiAvailable(true)
            tryEnrichWithAI(info.title || movie.title)
          }, retryAfter)
        }
      }

      setSearchQuery('')
    } catch (err) {
      setSearchError(err.message || 'Could not load movie details.')
    } finally {
      setLoadingDetails(false)
    }
  }

  const toggleStreaming = (service) => {
    setFormData(prev => ({
      ...prev,
      streaming: prev.streaming.includes(service)
        ? prev.streaming.filter(s => s !== service)
        : [...prev.streaming, service]
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    onSave({
      ...formData,
      year: formData.year ? parseInt(formData.year) : null
    })
  }

  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const input = darkMode ? 'bg-gray-700' : 'bg-gray-100'
  const border = darkMode ? 'border-gray-700' : 'border-gray-300'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40">
      <div className={`${card} rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-auto`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          {/* AI Status Indicator */}
          {!aiAvailable && (
            <span className="text-xs px-2 py-1 rounded bg-yellow-600/20 text-yellow-400 flex items-center gap-1">
              <span className="animate-pulse">●</span> AI busy
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Search Section */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search movie (add year: Cold War 2018)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleQuickSearch())}
              className={`flex-1 px-3 py-2 rounded ${input} border ${border}`}
            />
            <button
              type="button"
              onClick={handleQuickSearch}
              disabled={searching || !searchQuery.trim()}
              className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
            >
              {searching ? '...' : '🔍'}
            </button>
          </div>

          {searchError && <p className="text-red-400 text-sm">{searchError}</p>}
          {searching && <p className="text-purple-400 text-sm">Searching...</p>}
          {loadingDetails && <p className="text-purple-400 text-sm">Loading movie details...</p>}

          {/* AI Pending Status */}
          {aiPending && !loadingDetails && (
            <div className={`text-sm px-3 py-2 rounded ${darkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'} ${darkMode ? 'text-yellow-300' : 'text-yellow-700'} flex items-center gap-2`}>
              {enrichingAI ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Enhancing with AI...
                </>
              ) : !aiAvailable ? (
                <>
                  <span>⏸️</span>
                  AI temporarily busy. Genre, mood & streaming will update automatically.
                </>
              ) : (
                <>
                  <span className="animate-pulse">✨</span>
                  Fetching AI suggestions...
                </>
              )}
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className={`border ${border} rounded-lg max-h-64 overflow-y-auto`}>
              {searchResults.map((result) => (
                <button
                  key={result.tmdb_id}
                  type="button"
                  onClick={() => handleSelectMovie(result)}
                  className={`w-full flex items-center gap-2 p-2 ${input} hover:bg-purple-600/30 text-left border-b ${border} last:border-b-0`}
                >
                  {result.poster ? (
                    <img src={result.poster} alt="" className="w-8 h-12 object-cover rounded flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-12 bg-gray-600 rounded flex items-center justify-center text-sm flex-shrink-0">🎬</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{result.title} <span className="opacity-60">({result.year || '?'})</span></p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected Movie Poster */}
          {formData.poster && (
            <div className="flex justify-center">
              <img
                src={formData.poster}
                alt=""
                className="h-32 rounded"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            </div>
          )}

          {/* Title (editable) */}
          <input
            type="text"
            placeholder="Movie title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className={`w-full px-3 py-2 rounded ${input} border ${border}`}
          />

          <input
            type="text"
            placeholder="Director"
            value={formData.director}
            onChange={(e) => setFormData({ ...formData, director: e.target.value })}
            className={`w-full px-3 py-2 rounded ${input} border ${border}`}
          />

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <select
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className={`w-full px-3 py-2 rounded ${input} border ${border} ${aiPending && !formData.genre ? 'animate-pulse' : ''}`}
              >
                <option value="">Genre...</option>
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              {aiPending && !formData.genre && (
                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-xs text-yellow-400">⏳</span>
              )}
            </div>
            <input
              type="number"
              placeholder="Year"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              className={`w-24 px-3 py-2 rounded ${input} border ${border}`}
            />
          </div>

          <div className="relative">
            <select
              value={formData.mood}
              onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
              className={`w-full px-3 py-2 rounded ${input} border ${border} ${aiPending && !formData.mood ? 'animate-pulse' : ''}`}
            >
              <option value="">Mood...</option>
              {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            {aiPending && !formData.mood && (
              <span className="absolute right-8 top-1/2 -translate-y-1/2 text-xs text-yellow-400">⏳</span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm">Streaming:</p>
              {aiPending && formData.streaming.length === 0 && (
                <span className="text-xs text-yellow-400">⏳ Checking...</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {STREAMING.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleStreaming(s)}
                  className={`px-2 py-1 rounded text-xs ${
                    formData.streaming.includes(s)
                      ? 'bg-purple-600'
                      : 'bg-gray-600'
                  } hover:opacity-80`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm">Rating:</span>
            {[1, 2, 3, 4, 5].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setFormData({ ...formData, rating: s })}
                className={`text-xl ${s <= formData.rating ? 'text-yellow-400' : 'text-gray-500'} hover:text-yellow-300`}
              >
                ★
              </button>
            ))}
          </div>

          <textarea
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className={`w-full px-3 py-2 rounded ${input} border ${border}`}
            rows={2}
          />

          <input
            type="text"
            placeholder="Poster URL"
            value={formData.poster}
            onChange={(e) => setFormData({ ...formData, poster: e.target.value })}
            className={`w-full px-3 py-2 rounded ${input} border ${border}`}
          />

          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.title.trim()}
              className="flex-1 px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
            >
              {isEdit ? 'Save' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
