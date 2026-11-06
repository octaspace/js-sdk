---
'@octaspace/sdk-query': minor
'@octaspace/sdk-react': minor
---

First release.

- `@octaspace/sdk-query`: query options and key factories for TanStack Query v5 for every read operation of `@octaspace/sdk`: `accountQueries`, `computeQueries`, `renderQueries`, `sessionQueries`, `hostingQueries`, `networkQueries` and `statsQueries`, with the matching `*Keys`. Every query forwards TanStack's abort signal. Works with any TanStack Query adapter.
- `@octaspace/sdk-react`: `OctaProvider`, `useOctaClient()` and hooks for every read operation: `useBalance`, `useComputeMachines`, `useRenderMachines`, `useSessions`, `useSession`, `useSessionLogs`, `useHostingNodes`, `useNetworkInfo`, `useGpuCurrent`, `useGpuHistory` and `useGpuLocations`, built on the exported `useOctaRequest`. Hooks take `enabled`, `initialData` and `refetchIntervalMs`, return `data`, `error`, `loading`, `fetching` and `refetch()`, and cancel their requests on unmount and when the inputs change.
