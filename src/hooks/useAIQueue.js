import { useState, useEffect, useCallback, useRef } from 'react'

const RETRY_INTERVAL_MS = 30000 // Check every 30 seconds
const MAX_QUEUE_SIZE = 10

export function useAIQueue() {
  const [queue, setQueue] = useState([]) // Movies waiting for AI enrichment
  const [aiAvailable, setAiAvailable] = useState(true)
  const [retryAfter, setRetryAfter] = useState(null)
  const [processing, setProcessing] = useState(false)
  const processingRef = useRef(false)

  // Add a movie to the queue for background AI enrichment
  const addToQueue = useCallback((movieData) => {
    setQueue(prev => {
      // Don't add duplicates
      if (prev.some(m => m.title === movieData.title)) return prev
      // Limit queue size
      if (prev.length >= MAX_QUEUE_SIZE) {
        return [...prev.slice(1), movieData]
      }
      return [...prev, movieData]
    })
  }, [])

  // Remove a movie from the queue
  const removeFromQueue = useCallback((title) => {
    setQueue(prev => prev.filter(m => m.title !== title))
  }, [])

  // Check AI availability
  const checkAIStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/ai-status')
      if (response.ok) {
        const status = await response.json()
        setAiAvailable(status.ai_available)
        setRetryAfter(status.remaining_seconds > 0 ? Date.now() + status.remaining_seconds * 1000 : null)
        return status.ai_available
      }
    } catch (err) {
      console.error('Failed to check AI status:', err)
    }
    return false
  }, [])

  // Process a single movie from the queue
  const processNextInQueue = useCallback(async () => {
    if (processingRef.current || queue.length === 0) return null

    processingRef.current = true
    setProcessing(true)

    const movie = queue[0]

    try {
      const response = await fetch('/api/search-movie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: movie.title,
          aiOnly: true
        })
      })

      if (response.ok) {
        const aiData = await response.json()
        // Remove from queue and return enriched data
        setQueue(prev => prev.filter(m => m.title !== movie.title))
        setAiAvailable(true)

        return {
          ...movie,
          genre: aiData.genre || movie.genre,
          mood: aiData.mood || movie.mood,
          streaming: aiData.streaming?.length ? aiData.streaming : movie.streaming,
          ai_pending: false
        }
      } else if (response.status === 429) {
        // Rate limited
        const data = await response.json()
        setAiAvailable(false)
        setRetryAfter(Date.now() + (data.retry_after_seconds || 60) * 1000)
        return null
      }
    } catch (err) {
      console.error('Failed to process AI queue:', err)
    } finally {
      processingRef.current = false
      setProcessing(false)
    }

    return null
  }, [queue])

  // Periodic check and process
  useEffect(() => {
    if (queue.length === 0) return

    const processQueue = async () => {
      // Check if we should wait
      if (retryAfter && Date.now() < retryAfter) return

      // Check AI status first
      const available = await checkAIStatus()
      if (!available) return

      // Process next item
      await processNextInQueue()
    }

    // Initial check
    processQueue()

    // Set up interval
    const interval = setInterval(processQueue, RETRY_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [queue.length, retryAfter, checkAIStatus, processNextInQueue])

  return {
    queue,
    queueLength: queue.length,
    aiAvailable,
    retryAfter,
    processing,
    addToQueue,
    removeFromQueue,
    processNextInQueue,
    checkAIStatus
  }
}
