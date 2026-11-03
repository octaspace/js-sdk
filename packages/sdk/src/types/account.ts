/**
 * Account balance (`GET /accounts/balance`). The amount is `balance / 10 ** decimals` in
 * `currency`; read `decimals` from the response instead of assuming 6 (micro-USD today). The
 * balance can be negative, and it is read from a replica, so a recent charge or top-up may show
 * with a delay.
 */
export interface AccountBalance {
  balance: number
  currency: 'USD'
  decimals: number
}
