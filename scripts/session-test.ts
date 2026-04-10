/**
 * Live session test — creates real sessions and stops them.
 * Usage: OCTA_API_KEY=... node --import tsx/esm scripts/session-test.ts
 */

import { OctaClient } from '../src/index.js'

const API_KEY = process.env['OCTA_API_KEY']
if (!API_KEY) {
  console.error('OCTA_API_KEY is not set')
  process.exit(1)
}

const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m',
  cyan: '\x1b[36m', gray: '\x1b[90m',
}

const ok   = (m: string) => console.log(`  ${c.green}✓${c.reset} ${m}`)
const fail = (m: string) => console.log(`  ${c.red}✗${c.reset} ${m}`)
const info = (m: string) => console.log(`  ${c.gray}→${c.reset} ${c.dim}${m}${c.reset}`)
const step = (m: string) => console.log(`\n${c.bold}${c.cyan}▸ ${m}${c.reset}`)
const sep  = ()          => console.log(`\n${c.gray}${'─'.repeat(56)}${c.reset}`)

const client = new OctaClient({
  apiKey: API_KEY,
  timeoutMs: 30_000,
  retries: 1,
  onRequest: (ctx) => info(`${ctx.method} ${new URL(ctx.url).pathname}`),
})

// Ready states from Rails polling_service
const READY_STATES = new Set(['service configured', 'configured', 'running', 'ready'])
const BLOCKED_STATES = ['prepar', 'config', 'start', 'deploy', 'queue', 'provision', 'pending', 'build', 'pull', 'create', 'init']

function isReady(info: { is_ready?: boolean; progress?: string }): boolean {
  if (info.is_ready) return true
  if (info.progress && READY_STATES.has(info.progress.toLowerCase())) return true
  return false
}

function isBlocked(info: { progress?: string }): boolean {
  if (!info.progress) return false
  const p = info.progress.toLowerCase()
  return BLOCKED_STATES.some(s => p.includes(s))
}

async function pollUntilReady(uuid: string, maxWaitMs = 120_000): Promise<boolean> {
  const deadline = Date.now() + maxWaitMs
  let attempt = 0
  while (Date.now() < deadline) {
    const data = await client.services.session(uuid).info()
    if (isReady(data)) return true
    if (data.progress) process.stdout.write(`\r  ${c.yellow}○${c.reset} ${c.dim}${data.progress}${c.reset} (${++attempt * 3}s)   `)
    else process.stdout.write(`  ${c.yellow}○${c.reset} waiting... (${++attempt * 3}s)\r`)
    await new Promise(r => setTimeout(r, 3_000))
  }
  return false
}

let vpnPassed = false
let mrPassed  = false

// ─── TEST 1: VPN ─────────────────────────────────────────────
console.log(`\n${c.bold}Live Session Tests${c.reset}`)
sep()
console.log(`${c.bold}TEST 1: VPN session (cheapest by traffic_price_usd)${c.reset}`)

try {
  step('Fetching VPN nodes')
  const vpnNodes = await client.services.vpn.available()
  info(`${vpnNodes.length} VPN nodes available`)

  const cheapest = [...vpnNodes].sort((a, b) => a.traffic_price_usd - b.traffic_price_usd)[0]
  if (!cheapest) throw new Error('No VPN nodes available')

  info(`Selected: node ${cheapest.node_id} — ${cheapest.city}, ${cheapest.country}`)
  info(`Price: $${cheapest.traffic_price_usd.toFixed(6)}/GB`)
  info(`Residential: ${cheapest.residential}`)

  step('Starting VPN session (WireGuard)')
  const { uuid } = await client.services.vpn.start({ node_id: cheapest.node_id, subkind: 'wg' })
  ok(`Session created: ${uuid}`)

  step('Polling until ready')
  const ready = await pollUntilReady(uuid)
  process.stdout.write('\n')
  if (!ready) throw new Error('Session did not become ready within 2 minutes')
  ok('Session is ready')

  step('Session info')
  const sessionInfo = await client.services.session(uuid).info()
  info(`Progress:   ${sessionInfo.progress ?? '—'}`)
  info(`Public IP:  ${sessionInfo.public_ip ?? '—'}`)
  info(`Country:    ${sessionInfo.country ?? '—'}, ${sessionInfo.city ?? '—'}`)
  info(`Duration:   ${sessionInfo.duration}s`)
  info(`VPN config: ${sessionInfo.config ? `${sessionInfo.config.slice(0, 80).replace(/\n/g, ' ')}…` : '—'}`)
  if (sessionInfo.charge_amount) info(`Charged:    ${sessionInfo.charge_amount} Wei`)

  step('Session logs')
  const logs = await client.services.session(uuid).logs()
  info(`System entries: ${logs.system.length}`)
  if (logs.system.length > 0) info(`Last: ${logs.system.at(-1)?.msg}`)

  step('Stopping session (score: 5)')
  await client.services.session(uuid).stop({ score: 5 })
  ok('Session stopped')
  vpnPassed = true

} catch (err) {
  process.stdout.write('\n')
  const body = (err as Record<string, unknown>)?.body
  fail(`${err instanceof Error ? err.message : String(err)}${body ? `\n     ${JSON.stringify(body)}` : ''}`)
}

// ─── TEST 2: MR ──────────────────────────────────────────────
const APP_UUID = '406c0b3f-6726-4169-a3b4-6322995cd755'

sep()
console.log(`${c.bold}TEST 2: Compute (MR) session — App ${APP_UUID}${c.reset}`)

try {
  step('Fetching MR machines')
  const machines = await client.services.mr.available()
  info(`${machines.length} MR machines available`)

  // Sort by total_price_usd ascending; pick cheapest with enough resources
  const viable = [...machines]
    .filter(m => typeof m.total_price_usd === 'number' && m.cpu_cores >= 2 && m.total_memory >= 2 * 1024 ** 3)
    .sort((a, b) => a.total_price_usd - b.total_price_usd)

  info(`${viable.length} viable (≥2 cores, ≥2 GB RAM)`)

  // Fallback: any machine with a price if no viable found
  const cheapest = viable[0] ?? [...machines]
    .filter(m => typeof m.total_price_usd === 'number')
    .sort((a, b) => a.total_price_usd - b.total_price_usd)[0]

  if (!cheapest) throw new Error('No priced MR machines available')

  info(`Selected: node ${cheapest.node_id} — ${cheapest.city}, ${cheapest.country}`)
  info(`CPU: ${cheapest.cpu_model_name} (${cheapest.cpu_cores} cores)`)
  info(`RAM: ${(cheapest.total_memory / 1024 ** 3).toFixed(1)} GB`)
  info(`GPU: ${cheapest.is_has_gpu ? cheapest.gpus.map(g => g.model).join(', ') : 'none'}`)
  info(`Price: $${cheapest.total_price_usd.toFixed(6)}/hr`)

  // Try up to 10 cheapest nodes — some may return INTERNAL_ERROR if temporarily unavailable
  const candidates = viable.slice(0, 10)
  let uuid: string | undefined
  for (const candidate of candidates) {
    try {
      step(`Starting Compute session on node ${candidate.node_id} (${candidate.city})`)
      const res = await client.services.mr.start({
        node_id: candidate.node_id,
        disk_size: 10,
        image: 'ubuntu:24.04',
        app: APP_UUID,
      })
      uuid = res.uuid
      ok(`Session created: ${uuid}`)
      break
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      const body = (e as Record<string, unknown>)?.body
      fail(`Node ${candidate.node_id} rejected: ${msg}${body ? ` — ${JSON.stringify(body)}` : ''} — trying next`)
    }
  }
  if (!uuid) throw new Error('All candidate nodes returned errors')

  step('Polling until ready')
  const ready = await pollUntilReady(uuid)
  process.stdout.write('\n')
  if (!ready) throw new Error('Session did not become ready within 2 minutes')
  ok('Session is ready')

  step('Session info')
  const sessionInfo = await client.services.session(uuid).info()
  info(`App name:   ${sessionInfo.app_name ?? '—'}`)
  info(`Progress:   ${sessionInfo.progress ?? '—'}`)
  info(`Public IP:  ${sessionInfo.public_ip ?? '—'}`)
  info(`SSH direct: ${sessionInfo.ssh_direct?.host}:${sessionInfo.ssh_direct?.port}`)
  info(`SSH web:    ${sessionInfo.ssh_web ?? '—'}`)
  info(`Ports:      ${JSON.stringify(sessionInfo.ports_matrix)}`)
  info(`URLs:       ${JSON.stringify(sessionInfo.urls)}`)
  info(`Duration:   ${sessionInfo.duration}s`)
  if (sessionInfo.charge_amount) info(`Charged:    ${sessionInfo.charge_amount} Wei`)
  if (sessionInfo.node_hw) {
    info(`Node HW CPU: ${sessionInfo.node_hw.cpu}`)
    info(`Node HW GPU: ${sessionInfo.node_hw.gpu.map(g => g.model).join(', ') || 'none'}`)
  }

  step('Session logs')
  const logs = await client.services.session(uuid).logs()
  info(`Container log: ${logs.container.slice(0, 200).replace(/\n/g, ' ')}`)
  info(`System entries: ${logs.system.length}`)

  step('Stopping session (score: 5)')
  await client.services.session(uuid).stop({ score: 5 })
  ok('Session stopped')
  mrPassed = true

} catch (err) {
  process.stdout.write('\n')
  const body = (err as Record<string, unknown>)?.body
  fail(`${err instanceof Error ? err.message : String(err)}${body ? `\n     ${JSON.stringify(body)}` : ''}`)
}

// ─── Summary ─────────────────────────────────────────────────
sep()
console.log(`${c.bold}Results:${c.reset}`)
console.log(`  ${vpnPassed ? c.green + '✓' : c.red + '✗'}${c.reset} VPN session (create → ready → stop)`)
console.log(`  ${mrPassed  ? c.green + '✓' : c.red + '✗'}${c.reset} MR  session (create → ready → stop)`)
console.log()

if (!vpnPassed || !mrPassed) process.exit(1)
