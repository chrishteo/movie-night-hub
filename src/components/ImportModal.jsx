import { useState, useRef } from 'react'
import Modal from './Modal'
import { searchMovie } from '../lib/api'

// Parse CSV content into array of objects
function parseCSV(text) {
  const lines = text.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []

  // Parse header
  const header = parseCSVLine(lines[0])

  // Parse data rows
  const data = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row = {}
    header.forEach((key, idx) => {
      row[key] = values[idx] || ''
    })
    data.push(row)
  }

  return data
}

// Parse a single CSV line handling quoted fields
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

export default function ImportModal({
  onClose,
  onImport,
  darkMode,
  existingMovies = []
}) {
  const [step, setStep] = useState('upload') // upload, preview, importing
  const [csvData, setCsvData] = useState([])
  const [selectedMovies, setSelectedMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 })
  const fileInputRef = useRef(null)

  const card = darkMode ? 'bg-gray-700' : 'bg-gray-100'
  const border = darkMode ? 'border-gray-600' : 'border-gray-300'

  // Handle file selection
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setLoading(true)

    try {
      const text = await file.text()
      const data = parseCSV(text)

      if (data.length === 0) {
        setError('No data found in CSV file')
        setLoading(false)
        return
      }

      // Filter to only movies (skip TV Series, etc.)
      const movies = data.filter(row =>
        row['Title Type'] === 'Movie' || row['Title Type'] === 'movie'
      )

      if (movies.length === 0) {
        setError('No movies found in CSV. Make sure Title Type is "Movie".')
        setLoading(false)
        return
      }

      // Check for existing movies (by title match)
      const existingTitles = new Set(existingMovies.map(m => m.title?.toLowerCase()))

      // Map to our format
      const mappedMovies = movies.map(row => {
        const title = row['Original Title'] || row['Title'] || ''
        const isExisting = existingTitles.has(title.toLowerCase())

        return {
          imdb_id: row['Const'] || '',
          title: title,
          year: row['Year'] ? parseInt(row['Year']) : null,
          genres: row['Genres'] || '',
          director: row['Directors'] || '',
          imdb_rating: row['IMDb Rating'] ? parseFloat(row['IMDb Rating']) : null,
          runtime: row['Runtime (mins)'] ? parseInt(row['Runtime (mins)']) : null,
          isExisting,
          selected: !isExisting // Pre-select non-existing movies
        }
      })

      setCsvData(mappedMovies)
      setSelectedMovies(mappedMovies.filter(m => m.selected).map(m => m.imdb_id))

      // Note: Poster fetching disabled for dev mode compatibility
      // Movies will be imported with basic CSV data only

      setStep('preview')
    } catch (err) {
      setError('Failed to parse CSV file')
      console.error(err)
    }

    setLoading(false)
  }

  // Toggle movie selection
  const toggleMovie = (imdbId) => {
    setSelectedMovies(prev =>
      prev.includes(imdbId)
        ? prev.filter(id => id !== imdbId)
        : [...prev, imdbId]
    )
  }

  // Select/deselect all
  const toggleAll = () => {
    const selectable = csvData.filter(m => !m.isExisting).map(m => m.imdb_id)
    if (selectedMovies.length === selectable.length) {
      setSelectedMovies([])
    } else {
      setSelectedMovies(selectable)
    }
  }

  // Import selected movies
  const handleImport = async () => {
    const moviesToImport = csvData.filter(m =>
      selectedMovies.includes(m.imdb_id) && !m.isExisting
    )

    if (moviesToImport.length === 0) {
      setError('No movies selected')
      return
    }

    setStep('importing')
    setImportProgress({ current: 0, total: moviesToImport.length })

    // Import movies one by one, using searchMovie for full enrichment
    for (let i = 0; i < moviesToImport.length; i++) {
      const movie = moviesToImport[i]

      try {
        // Use searchMovie to get full data (poster, AI enrichment, ratings)
        // Include year in search for better accuracy
        const searchQuery = movie.year ? `${movie.title} ${movie.year}` : movie.title
        const enrichedData = await searchMovie(searchQuery)

        await onImport({
          title: enrichedData.title || movie.title,
          year: enrichedData.year || movie.year,
          director: enrichedData.director || movie.director,
          poster: enrichedData.poster || '',
          genre: enrichedData.genre || '',
          mood: enrichedData.mood || '',
          streaming: enrichedData.streaming || [],
          trailer_url: enrichedData.trailer_url || '',
          tmdb_rating: enrichedData.tmdb_rating,
          cast: enrichedData.cast || [],
          imdb_rating: enrichedData.imdb_rating || movie.imdb_rating,
          rotten_tomatoes: enrichedData.rotten_tomatoes
        })

        setImportProgress({ current: i + 1, total: moviesToImport.length })
      } catch (err) {
        console.error(`Failed to import ${movie.title}:`, err)
        // Continue with next movie
      }
    }

    // Close modal after import
    setTimeout(() => {
      onClose()
    }, 500)
  }

  return (
    <Modal
      onClose={onClose}
      title="Import from IMDB"
      darkMode={darkMode}
      maxWidth="max-w-2xl"
    >
      {step === 'upload' && (
        <div className="space-y-4">
          <p className="text-sm opacity-70">
            Import movies from your IMDB watchlist. Export your watchlist from IMDB as a CSV file, then upload it here.
          </p>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition-colors ${border}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />

            {loading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl">📁</span>
                <span className="font-medium">Click to select CSV file</span>
                <span className="text-sm opacity-70">or drag and drop</span>
              </div>
            )}
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <div className={`text-xs opacity-50 ${card} p-3 rounded`}>
            <p className="font-medium mb-1">How to export from IMDB:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to your IMDB watchlist</li>
              <li>Click the three dots menu (...)</li>
              <li>Select "Export"</li>
              <li>Upload the downloaded CSV here</li>
            </ol>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm">
              Found <strong>{csvData.length}</strong> movies.
              {csvData.filter(m => m.isExisting).length > 0 && (
                <span className="opacity-70 ml-1">
                  ({csvData.filter(m => m.isExisting).length} already in your list)
                </span>
              )}
            </p>
            <button
              onClick={toggleAll}
              className="text-sm text-purple-400 hover:text-purple-300"
            >
              {selectedMovies.length === csvData.filter(m => !m.isExisting).length
                ? 'Deselect All'
                : 'Select All'}
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <div className="max-h-96 overflow-y-auto space-y-2">
            {csvData.map((movie) => {
              const isSelected = selectedMovies.includes(movie.imdb_id)

              return (
                <div
                  key={movie.imdb_id}
                  className={`flex items-center gap-3 p-2 rounded ${card} ${
                    movie.isExisting ? 'opacity-50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={movie.isExisting}
                    onChange={() => toggleMovie(movie.imdb_id)}
                    className="w-4 h-4"
                  />

                  <div className="w-10 h-14 bg-gray-600 rounded flex items-center justify-center text-lg flex-shrink-0">
                    🎬
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{movie.title}</p>
                    <p className="text-xs opacity-70 truncate">
                      {movie.year}
                      {movie.director && ` • ${movie.director}`}
                      {movie.genres && ` • ${movie.genres}`}
                    </p>
                  </div>

                  {movie.isExisting && (
                    <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">
                      Already Added
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setStep('upload')
                setCsvData([])
                setSelectedMovies([])
              }}
              className={`px-4 py-2 rounded ${card} hover:opacity-80`}
            >
              Back
            </button>
            <button
              onClick={handleImport}
              disabled={selectedMovies.length === 0}
              className="flex-1 px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import {selectedMovies.length} Movie{selectedMovies.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <div className="space-y-4 py-8">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            <p className="text-lg font-medium">
              Importing movies...
            </p>
            <p className="text-sm opacity-70">
              {importProgress.current} of {importProgress.total}
            </p>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(importProgress.current / importProgress.total) * 100}%`
                }}
              />
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
