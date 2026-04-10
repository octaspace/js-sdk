import type { MrMachine, StartMrOptions, StartMrResult } from '../../types/index.js'
import { BaseResource } from '../base.js'
import { type RequestOverrides, withRequestOverrides } from '../request-options.js'

export class MrService extends BaseResource {
  async available(request?: RequestOverrides): Promise<MrMachine[]> {
    const res = await this.request<MrMachine[]>(
      withRequestOverrides({ method: 'GET', path: '/services/mr' }, request),
    )
    return res.data
  }

  async start(options: StartMrOptions): Promise<StartMrResult> {
    // The OCTA API expects an array of deploy items (even for a single machine).
    // Response is also an array: [{uuid: "..."}]
    const item = {
      id: 0,
      node_id: options.node_id,
      disk_size: options.disk_size,
      image: options.image,
      app: options.app ?? '',
      envs: options.envs ?? {},
      ports: options.ports ?? [],
      http_ports: options.http_ports ?? [],
      start_command: options.start_command ?? '',
      entrypoint: options.entrypoint ?? '',
    }

    const res = await this.request<StartMrResult[]>({
      method: 'POST',
      path: '/services/mr',
      body: [item],
    })

    const first = res.data[0]
    if (!first?.uuid) {
      throw new Error('Deploy response contained no session UUID')
    }
    return { uuid: first.uuid }
  }
}
