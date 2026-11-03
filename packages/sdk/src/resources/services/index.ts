import type { HttpTransport } from '../../transport/http.js'
import { SessionResource } from './session.js'
import { VpnService } from './vpn.js'

export class ServicesResource {
  readonly vpn: VpnService

  constructor(private readonly transport: HttpTransport) {
    this.vpn = new VpnService(transport)
  }

  session(uuid: string): SessionResource {
    return new SessionResource(this.transport, uuid)
  }
}

export { SessionResource, VpnService }
