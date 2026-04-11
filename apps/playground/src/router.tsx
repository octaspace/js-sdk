import { OctaProvider } from '@octaspace/sdk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Layout } from './components/layout'
import { ClientProvider, useClientContext } from './store/client-context'

// Page components — imported here to keep route definitions co-located
import { DiagnosticsPage } from './routes/diagnostics'
import { IndexPage } from './routes/index'
import { NetworkPage } from './routes/network'
import { NodesPage } from './routes/nodes'
import { ServicesPage } from './routes/services'
import { SessionsPage } from './routes/sessions'

// ─── App shell ────────────────────────────────────────────────────────────────

/**
 * Inner wrapper that reads the OctaClient from ClientProvider and bridges it
 * into OctaProvider (sdk-react) and QueryClientProvider (sdk-query).
 * Separate component so it runs inside ClientProvider's context.
 */
function AppShell() {
  const { client } = useClientContext()

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // SDK handles its own retry logic — disable TanStack Query's retry
            retry: false,
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  // When the OctaClient changes (API key / baseUrl / mock scenario changed),
  // remove all cached queries so the new client starts fresh — no stale data.
  useEffect(() => {
    queryClient.removeQueries()
  }, [client, queryClient])

  return (
    <OctaProvider client={client}>
      <QueryClientProvider client={queryClient}>
        <Layout />
        <ReactQueryDevtools buttonPosition="bottom-left" />
      </QueryClientProvider>
    </OctaProvider>
  )
}

function Root() {
  return (
    <ClientProvider>
      <AppShell />
    </ClientProvider>
  )
}

// ─── Routes ───────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({ component: Root })

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexPage,
})
const networkRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/network',
  component: NetworkPage,
})
const nodesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nodes',
  component: NodesPage,
})
const sessionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sessions',
  component: SessionsPage,
})
const servicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/services',
  component: ServicesPage,
})
const diagnosticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/diagnostics',
  component: DiagnosticsPage,
})

export const router = createRouter({
  routeTree: rootRoute.addChildren([
    indexRoute,
    networkRoute,
    nodesRoute,
    sessionsRoute,
    servicesRoute,
    diagnosticsRoute,
  ]),
})

// Augment the router type globally so Link/navigate are fully type-safe
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
