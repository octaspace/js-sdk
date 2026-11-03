import type { HttpTransport } from '../../transport/http.js'
import { VpnService } from './vpn.js'

export class ServicesResource {
  readonly vpn: VpnService

  constructor(transport: HttpTransport) {
    this.vpn = new VpnService(transport)
  }
}

export { VpnService }
