import { useState, useEffect, useCallback } from 'react'

export default function SpinWheel({
  movies,
  onClose,
  onMoviePicked,
  darkMode
}) {
  const [spinning, setSpinning] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState(null)

  const unwatched = movies.filter(m => !m.watched)

  const spin = useCallback(() => {
    if (unwatched.length === 0) return

    setSpinning(true)
    setSelectedMovie(null)

    const duration = 3000
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime

      if (elapsed < duration) {
        setSelectedMovie(unwatched[Math.floor(Math.random() * unwatched.length)])
        requestAnimationFrame(animate)
      } else {
        const finalPick = unwatched[Math.floor(Math.random() * unwatched.length)]
        setSelectedMovie(finalPick)
        setSpinning(false)
        onMoviePicked(finalPick)
      }
    }

    animate()
  }, [unwatched, onMoviePicked])

  const card = darkMode ? 'bg-gray-800' : 'bg-white'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40">
      <div className={`${card} rounded-lg p-6 w-full max-w-md text-center`}>
        <h2 className="text-xl font-bold mb-4">🎡 Spin the Wheel</h2>

        <div
          className={`w-40 h-40 mx-auto rounded-full border-8 border-purple-600 flex items-center justify-center mb-4 overflow-hidden ${
            spinning ? 'animate-spin' : ''
          }`}
          style={{ animationDuration: '0.1s' }}
        >
          {selectedMovie ? (
            <div className="p-2">
              {selectedMovie.poster ? (
                <img
                  src={selectedMovie.poster}
                  alt=""
                  className="w-16 h-24 object-cover mx-auto rounded"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              ) : (
                <div className="text-3xl">🎬</div>
              )}
              <p className="font-bold text-xs mt-1 truncate max-w-[120px]">
                {selectedMovie.title}
              </p>
            </div>
          ) : (
            <p className="opacity-50">Ready!</p>
          )}
        </div>

        {selectedMovie && !spinning && (
          <p className="text-green-400 font-bold mb-4">
            🎉 {selectedMovie.title}!
          </p>
        )}

        {unwatched.length === 0 && (
          <p className="text-yellow-400 text-sm mb-4">
            No unwatched movies to pick from!
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedMovie(null)
              onClose()
            }}
            className="flex-1 px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
          >
            Close
          </button>
          <button
            onClick={spin}
            disabled={spinning || unwatched.length === 0}
            className="flex-1 px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
          >
            {spinning ? '...' : 'Spin!'}
          </button>
        </div>
      </div>
    </div>
  )
}
