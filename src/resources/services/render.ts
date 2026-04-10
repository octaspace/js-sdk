import type { RenderMachine, StartRenderOptions, StartRenderResult } from '../../types/index.js'
import { BaseResource } from '../base.js'

export class RenderService extends BaseResource {
  async available(): Promise<RenderMachine[]> {
    const res = await this.request<RenderMachine[]>({ method: 'GET', path: '/services/render' })
    return res.data
  }

  async start(options: StartRenderOptions): Promise<StartRenderResult> {
    const res = await this.request<StartRenderResult>({
      method: 'POST',
      path: '/services/render',
      body: options,
    })
    return res.data
  }
}
