export interface IdleJob {
  is_up: boolean
  /** Uptime in seconds */
  uptime: number
  error?: string
}
