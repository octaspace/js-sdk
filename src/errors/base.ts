export class OctaError extends Error {
  override readonly name: string = 'OctaError'

  constructor(message: string) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
