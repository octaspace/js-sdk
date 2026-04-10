export interface App {
  category: string
  description: string
  envs: Record<string, string>
  extra: Record<string, unknown>
  http_ports: number[]
  image: string
  name: string
  personal: boolean
  ports: number[]
  start_command: string
  uuid: string
}
