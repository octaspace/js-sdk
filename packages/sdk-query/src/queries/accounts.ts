import type { OctaClient } from '@octaspace/sdk'
import { type QueryContext, requestFrom } from '../queryContext.js'
import { queryOptions } from '../queryOptions.js'

export const accountKeys = {
  all: () => ['@octaspace', 'accounts'] as const,
  balance: () => [...accountKeys.all(), 'balance'] as const,
}

export const accountQueries = {
  balance: (client: OctaClient) =>
    queryOptions({
      queryKey: accountKeys.balance(),
      queryFn: (ctx: QueryContext) => client.accounts.balance(requestFrom(ctx)),
    }),
}
