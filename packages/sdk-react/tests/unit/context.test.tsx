import type { OctaClient } from '@octaspace/sdk'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OctaProvider, useOctaClient } from '../../src/index.js'

describe('OctaProvider', () => {
  it('provides the client through context', () => {
    const client = {} as OctaClient
    let received: OctaClient | undefined

    function Probe() {
      received = useOctaClient()
      return null
    }

    render(
      <OctaProvider client={client}>
        <Probe />
      </OctaProvider>,
    )

    expect(received).toBe(client)
  })

  it('throws outside provider', () => {
    function Probe() {
      useOctaClient()
      return null
    }

    expect(() => render(<Probe />)).toThrow('useOctaClient must be used within an OctaProvider')
  })
})
