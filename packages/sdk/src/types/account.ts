/**
 * Account balance (`GET /accounts/balance`). The amount is `balance / 10 ** decimals` in
 * `currency`: micro-USD with `decimals: 6`. It already includes what running sessions have used
 * and can be negative. A recent charge or deposit can take a moment to appear.
 */
export interface AccountBalance {
  balance: number
  currency: 'USD'
  decimals: number
}
