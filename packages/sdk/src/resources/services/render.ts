import type { RenderMachine, StartRenderOptions, StartRenderResult } from '../../types/index.js'
import { BaseResource } from '../base.js'
import { type RequestOverrides, withRequestOverrides } from '../request-options.js'

export class RenderService extends BaseResource {
  async available(request?: RequestOverrides): Promise<RenderMachine[]> {
    const res = await this.request<RenderMachine[]>({
      ...withRequestOverrides({ method: 'GET', path: '/services/render' }, request),
    })
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
