import type { IdleJob } from '../types/index.js'
import { BaseResource } from './base.js'
import { type RequestOverrides, withRequestOverrides } from './request-options.js'

interface RawIdleJobLogs {
  /** GZIP compressed and Base64 encoded log */
  data: string
}

async function decodeGzipBase64(encoded: string): Promise<string> {
  // Decode base64 to binary
  const binaryStr = atob(encoded)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }

  // Decompress gzip using DecompressionStream (Node 18+ / modern browsers)
  const ds = new DecompressionStream('gzip')
  const writer = ds.writable.getWriter()
  const reader = ds.readable.getReader()

  await writer.write(bytes)
  await writer.close()

  const chunks: Uint8Array[] = []
  let done = false
  while (!done) {
    const result = await reader.read()
    done = result.done
    if (!result.done) {
      chunks.push(result.value)
    }
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const combined = new Uint8Array(totalLength)
  let offset = 0
  for (const chunk of chunks) {
    combined.set(chunk, offset)
    offset += chunk.length
  }

  return new TextDecoder().decode(combined)
}

export class IdleJobsResource extends BaseResource {
  async get(
    nodeId: string | number,
    jobId: string | number,
    request?: RequestOverrides,
  ): Promise<IdleJob> {
    const res = await this.request<IdleJob>(
      withRequestOverrides({ method: 'GET', path: `/idle_jobs/${nodeId}/${jobId}` }, request),
    )
    return res.data
  }

  async logs(
    nodeId: string | number,
    jobId: string | number,
    request?: RequestOverrides,
  ): Promise<string> {
    const res = await this.request<RawIdleJobLogs>(
      withRequestOverrides({ method: 'GET', path: `/idle_jobs/${nodeId}/${jobId}/logs` }, request),
    )
    return decodeGzipBase64(res.data.data)
  }
}
