import { describe, it, expect } from 'vitest'
import { formatCurrency, formatCurrencyCompact } from '@/utils/currency'

describe('formatCurrency', () => {
  it('formats EUR with currency symbol', () => {
    const result = formatCurrency(1234.56)
    expect(result).toContain('€')
    // Node ICU may format differently than browser; check for digits
    expect(result).toMatch(/1[.,]?234[.,]?56/)
  })

  it('formats zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('€')
    expect(result).toContain('0,00')
  })

  it('formats negative values', () => {
    const result = formatCurrency(-500)
    expect(result).toContain('500')
    expect(result).toContain('-')
  })

  it('formats large amounts with grouping', () => {
    const result = formatCurrency(1000000)
    expect(result).toContain('€')
    expect(result).toContain('1.000.000')
  })
})

describe('formatCurrencyCompact', () => {
  it('shows K for thousands', () => {
    const result = formatCurrencyCompact(1500)
    expect(result).toContain('€')
    expect(result).toContain('K')
  })

  it('shows M for millions', () => {
    const result = formatCurrencyCompact(2500000)
    expect(result).toContain('€')
    expect(result).toContain('M')
  })

  it('shows full for small amounts', () => {
    const result = formatCurrencyCompact(500)
    expect(result).toContain('500')
  })
})
