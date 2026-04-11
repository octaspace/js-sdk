import type { HttpTransport } from '../transport/http.js'
import type { ApiResponse, RequestOptions } from '../transport/types.js'

export abstract class BaseResource {
  constructor(protected readonly transport: HttpTransport) {}

  protected request<T>(options: RequestOptions): Promise<ApiResponse<T>> {
    return this.transport.request<T>(options)
  }
}
