import { describe, it, expect } from 'vitest'
import { formatDate, getLastSixMonths, getMonthKey } from '@/utils/date'

describe('formatDate', () => {
  it('formats ISO date string', () => {
    expect(formatDate('2026-07-15')).toBe('15/07/2026')
  })
})

describe('getLastSixMonths', () => {
  it('returns 6 months', () => {
    const months = getLastSixMonths()
    expect(months).toHaveLength(6)
  })

  it('is sorted oldest first', () => {
    const months = getLastSixMonths()
    for (let i = 1; i < months.length; i++) {
      expect(months[i].month > months[i - 1].month).toBe(true)
    }
  })
})

describe('getMonthKey', () => {
  it('returns YYYY-MM format', () => {
    const key = getMonthKey(new Date(2026, 6, 15)) // July = 6
    expect(key).toBe('2026-07')
  })
})
