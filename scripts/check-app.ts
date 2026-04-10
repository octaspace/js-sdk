import { OctaClient } from '../src/index.js'

const client = new OctaClient({ apiKey: process.env['OCTA_API_KEY']!, retries: 0 })

const apps = await client.apps.list()
const app = apps.find(a => a.uuid === '406c0b3f-6726-4169-a3b4-6322995cd755')
console.log('App:', JSON.stringify(app, null, 2))

// Also show cheapest 5 MR machines with key fields
const machines = await client.services.mr.available()
const sorted = [...machines]
  .filter(m => typeof m.total_price_usd === 'number' && m.cpu_cores >= 2)
  .sort((a, b) => a.total_price_usd - b.total_price_usd)
  .slice(0, 5)

console.log('\nTop 5 cheapest viable machines:')
for (const m of sorted) {
  console.log(`  node ${m.node_id} | ${m.city}, ${m.country} | ${m.cpu_cores}c / ${(m.total_memory/1024**3).toFixed(0)}GB | disk_free: ${(m.free_disk/1024**3).toFixed(0)}GB | $${m.total_price_usd.toFixed(5)}/hr | gpu: ${m.is_has_gpu ? m.gpus.map(g=>g.model).join(',') : 'none'}`)
}
