import { describe, expect, it } from 'vitest'
import { formatUsd, microUsdToUsd, usdToMicroUsd } from '../../src/utils/money.js'
import { nullStrings } from '../../src/utils/null-strings.js'

describe('money helpers', () => {
  it('formatUsd keeps all six decimals', () => {
    expect(formatUsd(0)).toBe('$0.000000')
    expect(formatUsd(100)).toBe('$0.000100')
    expect(formatUsd(2_147_661)).toBe('$2.147661')
    expect(formatUsd(-1_250_000)).toBe('-$1.250000')
    expect(formatUsd(Number.MAX_SAFE_INTEGER)).toBe('$9007199254.740991')
  })

  it('formatUsd rejects non-integers', () => {
    expect(() => formatUsd(1.5)).toThrow(RangeError)
  })

  it('converts between dollars and micro-USD', () => {
    expect(microUsdToUsd(2_147_661)).toBeCloseTo(2.147661)
    expect(usdToMicroUsd(0.1)).toBe(100_000)
    expect(usdToMicroUsd(0.0001)).toBe(100)
    expect(usdToMicroUsd(-2)).toBe(-2_000_000)
    expect(() => usdToMicroUsd(Number.NaN)).toThrow(RangeError)
  })
})

describe('nullStrings', () => {
  it('replaces "null" string values deeply, but not keys or other strings', () => {
    const value = { a: 'null', null: 'x', list: ['null', 1, { b: 'null', c: 'nullable' }] }
    expect(nullStrings(value)).toEqual({
      a: null,
      null: 'x',
      list: [null, 1, { b: null, c: 'nullable' }],
    })
  })
})
