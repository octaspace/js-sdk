/** Quick inspect — dump actual API response shapes */
import { OctaClient } from '../src/index.js'

const apiKey = process.env.OCTA_API_KEY
if (!apiKey) {
  console.error('OCTA_API_KEY is not set')
  process.exit(1)
}

const client = new OctaClient({
  apiKey,
  retries: 0,
})

console.log('\n=== First MR machine (all fields) ===')
const mr = await client.services.mr.available()
console.log(JSON.stringify(mr[0], null, 2))

console.log('\n=== First VPN node (all fields) ===')
const vpn = await client.services.vpn.available()
console.log(JSON.stringify(vpn[0], null, 2))
