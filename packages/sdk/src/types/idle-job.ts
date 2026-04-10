export interface IdleJob {
  is_up: boolean
  /** Uptime in seconds */
  uptime: number
  error?: string
}

export interface IdleJobLogs {
  /** Decoded log content (SDK handles base64+gzip decompression) */
  data: string
}
