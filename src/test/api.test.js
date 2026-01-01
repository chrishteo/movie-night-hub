import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { searchMovie, getRecommendations } from '../lib/api'
import { GENRES, MOODS, STREAMING } from '../utils/constants'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('API Functions', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('searchMovie', () => {
    it('should normalize a valid response', async () => {
      const mockResponse = {
        title: 'Inception',
        director: 'Christopher Nolan',
        year: 2010,
        genre: 'Sci-Fi',
        mood: 'Intense',
        poster: 'https://image.tmdb.org/t/p/w500/test.jpg',
        streaming: ['Netflix', 'Amazon Prime'],
        trailer_url: 'https://youtube.com/watch?v=test',
        tmdb_rating: 8.8,
        cast: ['Leonardo DiCaprio', 'Ellen Page'],
        imdb_rating: 8.8,
        rotten_tomatoes: 87
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await searchMovie('Inception')

      expect(result.title).toBe('Inception')
      expect(result.director).toBe('Christopher Nolan')
      expect(result.year).toBe(2010)
      expect(result.genre).toBe('Sci-Fi')
      expect(result.streaming).toEqual(['Netflix', 'Amazon Prime'])
    })

    it('should filter out invalid genres', async () => {
      const mockResponse = {
        title: 'Test Movie',
        genre: 'InvalidGenre',
        mood: 'InvalidMood',
        streaming: ['Netflix', 'InvalidService']
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await searchMovie('Test Movie')

      expect(result.genre).toBe('')
      expect(result.mood).toBe('')
      expect(result.streaming).toEqual(['Netflix'])
    })

    it('should handle missing fields with defaults', async () => {
      const mockResponse = {
        title: 'Minimal Movie'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await searchMovie('Minimal Movie')

      expect(result.title).toBe('Minimal Movie')
      expect(result.director).toBe('')
      expect(result.year).toBeNull()
      expect(result.streaming).toEqual([])
      expect(result.cast).toEqual([])
    })

    it('should throw error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'API Error' })
      })

      await expect(searchMovie('Test')).rejects.toThrow('API Error')
    })
  })

  describe('getRecommendations', () => {
    it('should normalize recommendations array', async () => {
      const mockResponse = [
        {
          title: 'Movie 1',
          director: 'Director 1',
          year: 2020,
          genre: 'Action',
          mood: 'Intense',
          reason: 'Similar vibe',
          poster: 'https://image.tmdb.org/t/p/w500/poster1.jpg'
        },
        {
          title: 'Movie 2',
          director: 'Director 2',
          year: 2019,
          genre: 'Comedy',
          mood: 'Fun',
          reason: 'You might like it'
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await getRecommendations([{ title: 'Test', genre: 'Action' }])

      expect(result).toHaveLength(2)
      expect(result[0].title).toBe('Movie 1')
      expect(result[0].reason).toBe('Similar vibe')
      expect(result[1].poster).toBe('')
    })

    it('should filter invalid genres and moods in recommendations', async () => {
      const mockResponse = [
        {
          title: 'Movie',
          genre: 'NotAGenre',
          mood: 'NotAMood',
          streaming: ['Netflix', 'FakeService']
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await getRecommendations([])

      expect(result[0].genre).toBe('')
      expect(result[0].mood).toBe('')
      expect(result[0].streaming).toEqual(['Netflix'])
    })
  })
})

describe('Data Validation', () => {
  it('should validate that all STREAMING services have colors', () => {
    const { STREAMING_COLORS } = require('../utils/constants')

    STREAMING.forEach(service => {
      expect(STREAMING_COLORS[service]).toBeDefined()
    })
  })

  it('should validate GENRES are strings', () => {
    GENRES.forEach(genre => {
      expect(typeof genre).toBe('string')
      expect(genre.length).toBeGreaterThan(0)
    })
  })

  it('should validate MOODS are strings', () => {
    MOODS.forEach(mood => {
      expect(typeof mood).toBe('string')
      expect(mood.length).toBeGreaterThan(0)
    })
  })
})
