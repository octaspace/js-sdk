import type { OctaClient } from '@octaspace/sdk'
import { queryOptions } from '../queryOptions.js'

export const accountKeys = {
  all: () => ['@octaspace', 'accounts'] as const,
  detail: () => [...accountKeys.all(), 'detail'] as const,
  balance: () => [...accountKeys.all(), 'balance'] as const,
}

export const accountQueries = {
  detail: (client: OctaClient) =>
    queryOptions({
      queryKey: accountKeys.detail(),
      queryFn: () => client.accounts.get(),
    }),

  balance: (client: OctaClient) =>
    queryOptions({
      queryKey: accountKeys.balance(),
      queryFn: () => client.accounts.balance(),
    }),
}
