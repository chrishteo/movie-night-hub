import { describe, it, expect } from 'vitest'
import { GENRES, MOODS, STREAMING, STREAMING_COLORS, SORT_OPTIONS } from '../utils/constants'

describe('Constants', () => {
  describe('GENRES', () => {
    it('should be an array with at least 5 genres', () => {
      expect(Array.isArray(GENRES)).toBe(true)
      expect(GENRES.length).toBeGreaterThanOrEqual(5)
    })

    it('should include common genres', () => {
      expect(GENRES).toContain('Action')
      expect(GENRES).toContain('Comedy')
      expect(GENRES).toContain('Drama')
    })

    it('should not have duplicates', () => {
      const unique = [...new Set(GENRES)]
      expect(unique.length).toBe(GENRES.length)
    })
  })

  describe('MOODS', () => {
    it('should be an array with at least 5 moods', () => {
      expect(Array.isArray(MOODS)).toBe(true)
      expect(MOODS.length).toBeGreaterThanOrEqual(5)
    })

    it('should include common moods', () => {
      expect(MOODS).toContain('Feel-good')
      expect(MOODS).toContain('Intense')
    })
  })

  describe('STREAMING', () => {
    it('should be an array with streaming services', () => {
      expect(Array.isArray(STREAMING)).toBe(true)
      expect(STREAMING.length).toBeGreaterThanOrEqual(5)
    })

    it('should include major streaming services', () => {
      expect(STREAMING).toContain('Netflix')
      expect(STREAMING).toContain('Disney+')
      expect(STREAMING).toContain('Amazon Prime')
    })

    it('should have "Other" as a fallback option', () => {
      expect(STREAMING).toContain('Other')
    })
  })

  describe('STREAMING_COLORS', () => {
    it('should have a color for each streaming service', () => {
      STREAMING.forEach(service => {
        expect(STREAMING_COLORS[service]).toBeDefined()
        expect(typeof STREAMING_COLORS[service]).toBe('string')
      })
    })

    it('should use Tailwind CSS classes', () => {
      Object.values(STREAMING_COLORS).forEach(color => {
        expect(color).toMatch(/^bg-/)
      })
    })
  })

  describe('SORT_OPTIONS', () => {
    it('should be an array of sort options', () => {
      expect(Array.isArray(SORT_OPTIONS)).toBe(true)
      expect(SORT_OPTIONS.length).toBeGreaterThanOrEqual(3)
    })

    it('should have value and label for each option', () => {
      SORT_OPTIONS.forEach(option => {
        expect(option).toHaveProperty('value')
        expect(option).toHaveProperty('label')
        expect(typeof option.value).toBe('string')
        expect(typeof option.label).toBe('string')
      })
    })

    it('should include common sort options', () => {
      const values = SORT_OPTIONS.map(o => o.value)
      expect(values).toContain('created_at')
      expect(values).toContain('rating')
      expect(values).toContain('title')
    })
  })
})
