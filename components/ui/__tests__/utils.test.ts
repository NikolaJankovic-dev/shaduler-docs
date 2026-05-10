import { describe, it, expect } from 'vitest'
import {
  formatTime,
  timeToMinutes,
  minutesToTime,
  generateHours,
} from '@/components/ui/shaduler'

describe('formatTime', () => {
  describe('24h format', () => {
    it('pads single-digit hours with leading zero', () => {
      expect(formatTime(0, '24h')).toBe('00:00')
      expect(formatTime(8, '24h')).toBe('08:00')
      expect(formatTime(9, '24h')).toBe('09:00')
    })

    it('renders double-digit hours unchanged', () => {
      expect(formatTime(13, '24h')).toBe('13:00')
      expect(formatTime(23, '24h')).toBe('23:00')
    })

    it('defaults to 24h when format omitted', () => {
      expect(formatTime(15)).toBe('15:00')
    })
  })

  describe('12h format', () => {
    it('renders midnight as "12 AM"', () => {
      expect(formatTime(0, '12h')).toBe('12 AM')
    })

    it('renders noon as "12 PM"', () => {
      expect(formatTime(12, '12h')).toBe('12 PM')
    })

    it('renders morning hours with AM', () => {
      expect(formatTime(1, '12h')).toBe('1 AM')
      expect(formatTime(11, '12h')).toBe('11 AM')
    })

    it('renders afternoon hours with PM (1-based)', () => {
      expect(formatTime(13, '12h')).toBe('1 PM')
      expect(formatTime(23, '12h')).toBe('11 PM')
    })
  })

  describe('with locale (Intl.DateTimeFormat)', () => {
    it('uses Intl when locale is provided', () => {
      // Spot-check shape rather than exact glyph: Intl output varies by ICU.
      const out = formatTime(9, '24h', 'en-US')
      expect(out).toMatch(/9/) // contains 9 in some form
    })

    it('reflects 24h vs 12h via hour12 option', () => {
      const h12 = formatTime(15, '12h', 'en-US')
      const h24 = formatTime(15, '24h', 'en-GB')
      expect(h12).toMatch(/PM|3/i)
      expect(h24).toMatch(/15/)
    })
  })
})

describe('timeToMinutes', () => {
  it('parses "HH:MM" correctly', () => {
    expect(timeToMinutes('00:00')).toBe(0)
    expect(timeToMinutes('09:00')).toBe(540)
    expect(timeToMinutes('09:30')).toBe(570)
    expect(timeToMinutes('23:59')).toBe(1439)
  })

  it('handles single-digit minute correctly when zero-padded', () => {
    expect(timeToMinutes('08:05')).toBe(485)
  })
})

describe('minutesToTime', () => {
  it('zero-pads hours and minutes', () => {
    expect(minutesToTime(0)).toBe('00:00')
    expect(minutesToTime(5)).toBe('00:05')
    expect(minutesToTime(540)).toBe('09:00')
    expect(minutesToTime(570)).toBe('09:30')
    expect(minutesToTime(1439)).toBe('23:59')
  })

  it('rounds non-integer minutes', () => {
    expect(minutesToTime(540.4)).toBe('09:00')
    expect(minutesToTime(540.6)).toBe('09:01')
  })

  it('clamps negative input to 0', () => {
    expect(minutesToTime(-30)).toBe('00:00')
  })
})

describe('timeToMinutes ↔ minutesToTime round-trip', () => {
  it('round-trips at hour boundaries', () => {
    for (let h = 0; h < 24; h++) {
      const time = `${h.toString().padStart(2, '0')}:00`
      expect(minutesToTime(timeToMinutes(time))).toBe(time)
    }
  })

  it('round-trips at quarter-hours', () => {
    for (let m = 0; m <= 1380; m += 15) {
      const t = minutesToTime(m)
      expect(timeToMinutes(t)).toBe(m)
    }
  })
})

describe('generateHours', () => {
  it('returns inclusive-start, exclusive-end integer range', () => {
    expect(generateHours(8, 12)).toEqual([8, 9, 10, 11])
  })

  it('returns empty array when start === end', () => {
    expect(generateHours(8, 8)).toEqual([])
  })

  it('handles full day', () => {
    const hours = generateHours(0, 24)
    expect(hours).toHaveLength(24)
    expect(hours[0]).toBe(0)
    expect(hours[23]).toBe(23)
  })
})
