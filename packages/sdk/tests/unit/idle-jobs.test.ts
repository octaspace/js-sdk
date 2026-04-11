import { describe, expect, it, vi } from 'vitest'
import { makeClient, makeResponse } from './helpers.js'

// Pre-encoded "hello world" gzip+base64 for testing
// Generated with: echo -n 'hello world' | gzip | base64
const GZIP_B64_HELLO = 'H4sIAN6R2GkAA8tIzcnJVyjPL8pJAQCFEUoNCwAAAA=='

describe('IdleJobsResource', () => {
  it('get() returns job status', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({ is_up: true, uptime: 3600 }))
    const client = makeClient(mockFetch)
    const job = await client.idleJobs.get('node_1', 'job_1')

    expect(job.is_up).toBe(true)
    expect(job.uptime).toBe(3600)
    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toContain('/idle_jobs/node_1/job_1')
  })

  it('logs() decodes gzip+base64 content', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(makeResponse({ data: GZIP_B64_HELLO }))
    const client = makeClient(mockFetch)
    const decoded = await client.idleJobs.logs('node_1', 'job_1')

    expect(decoded).toBe('hello world')
    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toContain('/idle_jobs/node_1/job_1/logs')
  })
})
