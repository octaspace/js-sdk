import { OctaError } from './base.js'

export class OctaApiError extends OctaError {
  override readonly name: string = 'OctaApiError'

  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly requestId?: string,
    readonly body?: unknown,
  ) {
    super(message)
  }
}

export class OctaAuthenticationError extends OctaApiError {
  override readonly name: string = 'OctaAuthenticationError'
}

export class OctaPermissionError extends OctaApiError {
  override readonly name: string = 'OctaPermissionError'
}

export class OctaNotFoundError extends OctaApiError {
  override readonly name: string = 'OctaNotFoundError'
}

export class OctaValidationError extends OctaApiError {
  override readonly name: string = 'OctaValidationError'
}

export class OctaRateLimitError extends OctaApiError {
  override readonly name: string = 'OctaRateLimitError'

  constructor(
    message: string,
    status: number,
    readonly retryAfter?: number,
    code?: string,
    requestId?: string,
    body?: unknown,
  ) {
    super(message, status, code, requestId, body)
  }
}

export class OctaServerError extends OctaApiError {
  override readonly name: string = 'OctaServerError'
}
