/** Platform statistics (`GET /network`), a snapshot refreshed every few minutes. */
export interface NetworkInfo {
  /** Snapshot time, Unix **seconds** */
  at: number
  nodes: {
    online: number
    available: number
    rented: number
    countries: number
  }
  power: {
    cpu_cores: number
    /** Bytes */
    disk: number
    gpus: number
    /** Bytes */
    memory: number
    tflops: number
  }
  render: {
    frames_24h: number
    frames_total: number
    /** `week` is an ISO date (`YYYY-MM-DD`) */
    frames_by_week: Array<{ week: string; frames: number }>
  }
  sessions: {
    running: number
    total: number
    last_24h: number
  }
  users: {
    total: number
    last_24h: number
  }
  vpn: {
    nodes: number
    countries: number
  }
}
