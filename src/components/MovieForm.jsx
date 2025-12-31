import { useState } from 'react'
import { GENRES, MOODS, STREAMING } from '../utils/constants'
import { searchMovie } from '../lib/api'

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
    favorite: movie?.favorite || false
  })
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  const handleSearch = async () => {
    if (!formData.title.trim()) return

    setSearching(true)
    setSearchError('')

    try {
      const info = await searchMovie(formData.title)
      setFormData(prev => ({
        ...prev,
        title: info.title || prev.title,
        director: info.director || prev.director,
        year: info.year || prev.year,
        genre: info.genre || prev.genre,
        mood: info.mood || prev.mood,
        poster: info.poster || prev.poster,
        streaming: info.streaming?.length ? info.streaming : prev.streaming
      }))
    } catch (err) {
      setSearchError(err.message || 'Could not find movie info.')
    } finally {
      setSearching(false)
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
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Movie title..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`flex-1 px-3 py-2 rounded ${input} border ${border}`}
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching || !formData.title.trim()}
              className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
            >
              {searching ? '...' : '🔍'}
            </button>
          </div>

          {searchError && <p className="text-red-400 text-sm">{searchError}</p>}
          {searching && <p className="text-purple-400 text-sm">Searching with AI...</p>}

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

          <input
            type="text"
            placeholder="Director"
            value={formData.director}
            onChange={(e) => setFormData({ ...formData, director: e.target.value })}
            className={`w-full px-3 py-2 rounded ${input} border ${border}`}
          />

          <div className="flex gap-2">
            <select
              value={formData.genre}
              onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
              className={`flex-1 px-3 py-2 rounded ${input} border ${border}`}
            >
              <option value="">Genre...</option>
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <input
              type="number"
              placeholder="Year"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              className={`w-24 px-3 py-2 rounded ${input} border ${border}`}
            />
          </div>

          <select
            value={formData.mood}
            onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
            className={`w-full px-3 py-2 rounded ${input} border ${border}`}
          >
            <option value="">Mood...</option>
            {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <div>
            <p className="text-sm mb-2">Streaming:</p>
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
