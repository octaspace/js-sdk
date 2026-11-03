import type { BatchId, MachineGpu } from '../types/common.js'
import { nullStrings } from '../utils/null-strings.js'

const GPU_INTEGER_FIELDS = [
  'mem_total_mb',
  'pcie_link_gen',
  'pcie_link_width',
  'core_clock',
  'mem_clock',
  'power_limit',
] as const

/**
 * Normalizes a machine listing: `"null"` strings become `null`, and GPU integer fields sent as
 * strings (`""`, `"390"`) become `null` or numbers, so one misreporting node does not break the
 * typed listing.
 */
export function normalizeMachines<T extends { gpus?: MachineGpu[] }>(machines: T[]): T[] {
  nullStrings(machines)
  for (const machine of machines) {
    for (const gpu of machine.gpus ?? []) {
      const record = gpu as unknown as Record<string, unknown>
      for (const field of GPU_INTEGER_FIELDS) {
        const value = record[field]
        if (typeof value === 'string') {
          const trimmed = value.trim()
          record[field] =
            trimmed !== '' && Number.isFinite(Number(trimmed)) ? Number(trimmed) : null
        }
      }
    }
  }
  return machines
}

/**
 * Copies only the listed keys whose value is not `undefined`, so the request body never carries
 * fields the caller did not set (the API refuses unknown fields and treats some absences, like
 * `ssh`/`fm`, differently from `false`).
 */
export function pickDefined<T extends object, K extends keyof T>(
  source: T,
  keys: readonly K[],
): Partial<Pick<T, K>> {
  const result: Partial<Pick<T, K>> = {}
  for (const key of keys) {
    if (source[key] !== undefined) {
      result[key] = source[key]
    }
  }
  return result
}

/** Gives every batch item an id: its own, or its position in the array. */
export function withBatchIds<T extends { id?: BatchId | undefined }>(
  items: readonly T[],
): Array<Omit<T, 'id'> & { id: BatchId }> {
  return items.map((item, index) => ({ ...item, id: item.id ?? index }))
}
