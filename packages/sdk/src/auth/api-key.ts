export class ApiKeyAuth {
  constructor(private readonly apiKey: string) {}

  applyToHeaders(headers: Headers): void {
    headers.set('Authorization', this.apiKey)
  }
}
