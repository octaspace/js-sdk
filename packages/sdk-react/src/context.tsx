import type { OctaClient } from '@octaspace/sdk'
import type { ReactNode } from 'react'
import { createContext, useContext } from 'react'

const OctaContext = createContext<OctaClient | null>(null)

export function OctaProvider({
  client,
  children,
}: {
  client: OctaClient
  children: ReactNode
}) {
  return <OctaContext.Provider value={client}>{children}</OctaContext.Provider>
}

export function useOctaClient(): OctaClient {
  const client = useContext(OctaContext)

  if (!client) {
    throw new Error('useOctaClient must be used within an OctaProvider')
  }

  return client
}
