import type { HttpTransport } from '../../transport/http.js'
import { MrService } from './mr.js'
import { RenderService } from './render.js'
import { SessionResource } from './session.js'
import { VpnService } from './vpn.js'

export class ServicesResource {
  readonly mr: MrService
  readonly render: RenderService
  readonly vpn: VpnService

  constructor(private readonly transport: HttpTransport) {
    this.mr = new MrService(transport)
    this.render = new RenderService(transport)
    this.vpn = new VpnService(transport)
  }

  session(uuid: string): SessionResource {
    return new SessionResource(this.transport, uuid)
  }
}

export { MrService, RenderService, SessionResource, VpnService }
