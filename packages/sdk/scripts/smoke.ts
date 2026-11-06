/**
 * Smoke test — runs against the live API (default: https://api-dev.octa.space).
 *
 * Usage:
 *   pnpm smoke                                    # public endpoints only
 *   OCTA_API_KEY=octa_ak_… pnpm smoke             # all suites
 *   OCTA_API_KEY=octa_ak_… pnpm smoke --suite network,stats
 *   OCTA_API_URL=https://… pnpm smoke             # another host
 *
 * Read-only: no session is started, no price is changed.
 */

import {
  DEFAULT_BASE_URL,
  formatUsd,
  gpuHistoryPoints,
  isComputeSession,
  OctaClient,
  type OctaClientOptions,
} from '../src/index.js'

// ─── CLI args ────────────────────────────────────────────────────────────────

const SUITES = ['network', 'stats', 'compute', 'render', 'account', 'sessions', 'hosting'] as const
type Suite = (typeof SUITES)[number]
const AUTH_SUITES = new Set<Suite>(['account', 'sessions', 'hosting'])

const args = process.argv.slice(2)
const suiteIdx = args.indexOf('--suite')
const suiteArg = suiteIdx !== -1 ? args[suiteIdx + 1] : undefined
const onlyFilter: Set<string> | null = suiteArg
  ? new Set(suiteArg.split(',').map((s) => s.trim()))
  : null

// ─── Colour helpers ──────────────────────────────────────────────────────────

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
}

const ok = (msg: string) => console.log(`  ${c.green}✓${c.reset} ${msg}`)
const fail = (msg: string) => console.log(`  ${c.red}✗${c.reset} ${msg}`)
const info = (msg: string) => console.log(`  ${c.gray}→${c.reset} ${c.dim}${msg}${c.reset}`)
const section = (name: string) => console.log(`\n${c.bold}${c.cyan}[ ${name} ]${c.reset}`)
const skip = (reason: string) =>
  console.log(`  ${c.yellow}○${c.reset} ${c.dim}skipped — ${reason}${c.reset}`)

// ─── Test runner ─────────────────────────────────────────────────────────────

interface TestResult {
  name: string
  passed: boolean
  durationMs: number
  error?: string
}

const results: TestResult[] = []

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  const start = Date.now()
  try {
    await fn()
    const ms = Date.now() - start
    results.push({ name, passed: true, durationMs: ms })
    ok(`${name} ${c.gray}(${ms}ms)${c.reset}`)
  } catch (err) {
    const ms = Date.now() - start
    const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    results.push({ name, passed: false, durationMs: ms, error: message })
    fail(`${name} ${c.gray}(${ms}ms)${c.reset}`)
    console.log(`     ${c.red}${message}${c.reset}`)
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

// ─── Setup ───────────────────────────────────────────────────────────────────

const apiKey = process.env.OCTA_API_KEY?.trim() || undefined
const baseUrl = process.env.OCTA_API_URL?.trim() || DEFAULT_BASE_URL

const clientOptions: OctaClientOptions = {
  baseUrl,
  timeoutMs: 15_000,
  retries: 1,
  ...(apiKey !== undefined && { apiKey }),
}
const client = new OctaClient(clientOptions)

function shouldRun(suite: Suite): boolean {
  if (onlyFilter !== null && !onlyFilter.has(suite)) return false
  if (AUTH_SUITES.has(suite) && !apiKey) {
    section(suite)
    skip('set OCTA_API_KEY (octa_ak_…) to run it')
    return false
  }
  return true
}

console.log(`\n${c.bold}OctaSpace SDK smoke tests${c.reset}`)
console.log(`${c.gray}Base URL: ${baseUrl}${apiKey ? '' : ' (anonymous)'}${c.reset}`)
console.log(
  `${c.gray}Suites: ${onlyFilter ? [...onlyFilter].join(', ') : SUITES.join(', ')}${c.reset}`,
)

// ─── Suites ──────────────────────────────────────────────────────────────────

if (shouldRun('network')) {
  section('network')
  await test('GET /network', async () => {
    const net = await client.network.info()
    assert(typeof net.at === 'number', 'at is not a number')
    info(
      `${net.nodes.online} nodes online, ${net.power.gpus} GPUs, ${net.sessions.running} sessions running`,
    )
  })
}

if (shouldRun('stats')) {
  section('stats')
  await test('GET /stats/gpu/current', async () => {
    const current = await client.stats.gpuCurrent()
    assert(Array.isArray(current.gpus), 'gpus is not an array')
    const top = current.gpus[0]
    if (top) info(`${top.model}: ${top.total} GPUs, ${top.rented} rented`)
  })
  await test('GET /stats/gpu/history', async () => {
    const history = await client.stats.gpuHistory({ step: 3600 })
    const [model, series] = Object.entries(history)[0] ?? []
    if (model && series) info(`${model}: ${gpuHistoryPoints(series).length} points`)
  })
  await test('GET /stats/gpu/locations', async () => {
    const locations = await client.stats.gpuLocations()
    assert(Array.isArray(locations), 'locations is not an array')
    info(`${locations.length} city/model rows`)
  })
}

if (shouldRun('compute')) {
  section('compute')
  await test('GET /services/compute', async () => {
    const machines = await client.compute.list()
    assert(Array.isArray(machines), 'response is not an array')
    info(`${machines.length} machines${apiKey ? '' : ' (anonymous listing is cached up to 1 h)'}`)
    for (const m of machines.slice(0, 3)) {
      const gpus = m.gpus.map((g) => g.model).join(', ') || 'no GPU'
      info(`  ${m.node_number} ${formatUsd(m.base_price)}/h, ${m.cpu_cores} cores, ${gpus}`)
    }
  })
}

if (shouldRun('render')) {
  section('render')
  await test('GET /services/render', async () => {
    const nodes = await client.render.list()
    assert(Array.isArray(nodes), 'response is not an array')
    info(`${nodes.length} render nodes`)
  })
}

if (shouldRun('account')) {
  section('account')
  await test('GET /accounts/balance', async () => {
    const balance = await client.accounts.balance()
    assert(Number.isInteger(balance.balance), 'balance is not an integer')
    const amount = (balance.balance / 10 ** balance.decimals).toFixed(balance.decimals)
    info(`${amount} ${balance.currency}`)
  })
}

if (shouldRun('sessions')) {
  section('sessions')
  await test('GET /sessions', async () => {
    const sessions = await client.sessions.list()
    assert(Array.isArray(sessions), 'response is not an array')
    info(`${sessions.length} running sessions`)
    for (const s of sessions.slice(0, 3)) {
      info(`  ${s.uuid} ${s.service} ${s.status} node ${s.node_number ?? '?'}`)
    }
    const compute = sessions.find(isComputeSession)
    if (compute) {
      const logs = await client.sessions.logs(compute.uuid, { tail: 1 })
      info(`  logs of ${compute.uuid}: ${logs.system.length} system events`)
    }
  })
}

if (shouldRun('hosting')) {
  section('hosting')
  await test('GET /hosting/nodes', async () => {
    const nodes = await client.hosting.nodes()
    assert(Array.isArray(nodes), 'response is not an array')
    info(`${nodes.length} online nodes`)
    for (const n of nodes.slice(0, 3)) {
      info(`  ${n.number} ${n.status}, base ${formatUsd(n.prices.base)}/h`)
    }
  })
}

// ─── Summary ─────────────────────────────────────────────────────────────────

const passed = results.filter((r) => r.passed).length
const failed = results.filter((r) => !r.passed).length
const totalMs = results.reduce((sum, r) => sum + r.durationMs, 0)

console.log(`\n${'─'.repeat(50)}`)
console.log(
  `${c.bold}Results: ${passed} passed, ${failed > 0 ? c.red : ''}${failed} failed${c.reset}  ` +
    `${c.gray}(${totalMs}ms total)${c.reset}`,
)
if (client.rateLimit) {
  console.log(`${c.gray}Rate limit: ${JSON.stringify(client.rateLimit)}${c.reset}`)
}

if (failed > 0) {
  console.log(`\n${c.red}Failed tests:${c.reset}`)
  for (const r of results.filter((r) => !r.passed)) {
    console.log(`  ${c.red}✗${c.reset} ${r.name}`)
    if (r.error) console.log(`    ${c.gray}${r.error}${c.reset}`)
  }
  console.log()
  process.exit(1)
}

console.log()
