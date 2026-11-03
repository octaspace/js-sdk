import type { MicroUsd } from '../types/common.js'

/** Number of micro-USD in one dollar. */
export const MICRO_USD_PER_USD = 1_000_000

/**
 * Converts micro-USD to dollars. Use it for display or arithmetic that tolerates floating-point
 * rounding; keep micro-USD integers for exact sums.
 */
export function microUsdToUsd(amount: MicroUsd): number {
  return amount / MICRO_USD_PER_USD
}

/**
 * Converts dollars to micro-USD, rounded to the nearest integer (e.g. for `hosting.setPrices`).
 * Throws a `RangeError` for a non-finite value.
 */
export function usdToMicroUsd(usd: number): MicroUsd {
  if (!Number.isFinite(usd)) {
    throw new RangeError(`Not a finite dollar amount: ${usd}`)
  }
  return Math.round(usd * MICRO_USD_PER_USD)
}

/**
 * Formats micro-USD as dollars with all six decimal places, using integer arithmetic so no
 * precision is lost: `100` → `"$0.000100"`, `-1250000` → `"-$1.250000"`.
 */
export function formatUsd(amount: MicroUsd): string {
  if (!Number.isSafeInteger(amount)) {
    throw new RangeError(`Not a micro-USD integer: ${amount}`)
  }
  const sign = amount < 0 ? '-' : ''
  const abs = Math.abs(amount)
  const whole = Math.floor(abs / MICRO_USD_PER_USD)
  const fraction = String(abs % MICRO_USD_PER_USD).padStart(6, '0')
  return `${sign}$${whole}.${fraction}`
}
