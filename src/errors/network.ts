import { OctaError } from './base.js'

export class OctaNetworkError extends OctaError {
  override readonly name: string = 'OctaNetworkError'
}

export class OctaTimeoutError extends OctaNetworkError {
  override readonly name: string = 'OctaTimeoutError'
}
