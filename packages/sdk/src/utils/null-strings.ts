/**
 * The next API sometimes sends a missing value as the string `"null"` instead of JSON `null`: in
 * GPU statistics (price percentiles, TFLOPS) and in what nodes report about their hardware
 * (`mem_clock`, `power_limit`, `fan_speed`, …). This replaces every `"null"` string value (not
 * object keys) with `null`, in place.
 *
 * It must not be applied where `"null"` can be real data, such as a session's environment
 * variables.
 */
export function nullStrings<T>(value: T): T {
  return replace(value) as T
}

function replace(value: unknown): unknown {
  if (value === 'null') {
    return null
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      value[i] = replace(value[i])
    }
    return value
  }
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>
    for (const key of Object.keys(record)) {
      record[key] = replace(record[key])
    }
  }
  return value
}
