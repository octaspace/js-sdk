export interface Account {
  account_uuid: string
  avatar: string
  /** Balance in Wei */
  balance: number
  email: string
  ref_code: string
  uid: number
  wallet: string
}

export interface Balance {
  /** Balance in Wei */
  balance: number
}

export interface Wallet {
  address: string
}
