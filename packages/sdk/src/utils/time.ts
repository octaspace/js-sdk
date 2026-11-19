/** A Unix-seconds value or a Date as Unix seconds; `undefined` stays `undefined`. */
export function unixSeconds(value: number | Date | undefined): number | undefined {
  return value instanceof Date ? Math.floor(value.getTime() / 1000) : value
}
