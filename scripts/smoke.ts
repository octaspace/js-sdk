/**
 * Smoke test — runs against the real OCTA API.
 *
 * Usage:
 *   OCTA_API_KEY=your_key pnpm smoke
 *   OCTA_API_KEY=your_key pnpm smoke --only network,account
 *
 * All tests are read-only (GET requests only).
 * No sessions are started, no data is mutated.
 */

import {
  OctaAuthenticationError,
  OctaClient,
  type OctaClientOptions,
} from '../src/index.js'

// ─── CLI args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const suiteIdx = args.indexOf('--suite')
const onlyFilter: Set<string> | null =
  suiteIdx !== -1 && args[suiteIdx + 1]
    ? new Set(args[suiteIdx + 1]!.split(',').map((s) => s.trim()))
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
const section = (name: string) =>
  console.log(`\n${c.bold}${c.cyan}[ ${name} ]${c.reset}`)

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
    const message = err instanceof Error ? err.message : String(err)
    results.push({ name, passed: false, durationMs: ms, error: message })
    fail(`${name} ${c.gray}(${ms}ms)${c.reset}`)
    console.log(`     ${c.red}${message}${c.reset}`)
  }
}

function skip(reason: string) {
  console.log(`  ${c.yellow}○${c.reset} ${c.dim}skipped — ${reason}${c.reset}`)
}

function shouldRun(suite: string): boolean {
  return onlyFilter === null || onlyFilter.has(suite)
}

// ─── Setup ───────────────────────────────────────────────────────────────────

const apiKey = process.env['OCTA_API_KEY']
if (!apiKey) {
  console.error(`\n${c.red}Error:${c.reset} OCTA_API_KEY environment variable is not set.\n`)
  console.error(`  Run: ${c.cyan}OCTA_API_KEY=your_key npm run smoke${c.reset}\n`)
  process.exit(1)
}

const clientOptions: OctaClientOptions = {
  apiKey,
  timeoutMs: 15_000,
  retries: 1,
  onRequest(ctx) {
    info(`${ctx.method} ${new URL(ctx.url).pathname}`)
  },
}

const client = new OctaClient(clientOptions)

console.log(`\n${c.bold}OCTA SDK Smoke Tests${c.reset}`)
console.log(`${c.gray}Base URL: https://api.octa.computer${c.reset}`)
if (onlyFilter) {
  console.log(`${c.gray}Running suites: ${[...onlyFilter].join(', ')}${c.reset}`)
} else {
  console.log(`${c.gray}Tip: run specific suites with --suite network,account${c.reset}`)
}

// ─── Suites ──────────────────────────────────────────────────────────────────

// 1. Network (public — validates connectivity without auth)
if (shouldRun('network')) {
  section('Network (public)')

  await test('GET /network returns valid stats', async () => {
    const stats = await client.network.get()

    if (typeof stats.market_price !== 'number') throw new Error('market_price is not a number')
    if (typeof stats.nodes.count !== 'number') throw new Error('nodes.count is not a number')
    if (typeof stats.blockchain.height !== 'number')
      throw new Error('blockchain.height is not a number')

    info(`Market price: $${stats.market_price}`)
    info(`Total nodes: ${stats.nodes.count} (VPN: ${stats.nodes.vpn})`)
    info(`Block height: ${stats.blockchain.height}`)
    if (stats.mmROI !== undefined) info(`Monthly staking ROI: ${stats.mmROI}%`)
  })
}

// 2. Authentication check
if (shouldRun('auth')) {
  section('Authentication')

  await test('Valid API key is accepted', async () => {
    const account = await client.accounts.get()
    if (!account.email) throw new Error('No email in account response')
    info(`Authenticated as: ${account.email}`)
    info(`UID: ${account.uid}`)
  })

  await test('Invalid API key throws OctaAuthenticationError', async () => {
    const badClient = new OctaClient({ apiKey: 'invalid_key_12345', retries: 0 })
    try {
      await badClient.accounts.get()
      throw new Error('Expected error was not thrown')
    } catch (err) {
      if (!(err instanceof OctaAuthenticationError)) {
        throw new Error(`Expected OctaAuthenticationError, got: ${String(err)}`)
      }
      info(`Correctly received ${err.name} (status ${err.status})`)
    }
  })
}

// 3. Account
if (shouldRun('account')) {
  section('Account')

  await test('GET /accounts returns account object', async () => {
    const account = await client.accounts.get()
    const required = ['account_uuid', 'email', 'uid', 'balance'] as const
    for (const field of required) {
      if (account[field] === undefined) throw new Error(`Missing field: ${field}`)
    }
    info(`Balance: ${account.balance} Wei`)
    info(`Wallet: ${account.wallet || '(none)'}`)
  })

  await test('GET /accounts/balance returns balance', async () => {
    const { balance } = await client.accounts.balance()
    if (typeof balance !== 'number') throw new Error('balance is not a number')
    info(`Balance: ${balance} Wei`)
  })
}

// 4. Apps
if (shouldRun('apps')) {
  section('Apps')

  await test('GET /apps returns array', async () => {
    const apps = await client.apps.list()
    if (!Array.isArray(apps)) throw new Error('Response is not an array')
    info(`${apps.length} apps available`)
    if (apps.length > 0) {
      info(`First: ${apps[0]!.name} — ${apps[0]!.image}`)
    }
  })
}

// 5. Nodes
if (shouldRun('nodes')) {
  section('Nodes')

  let firstNodeId: number | undefined

  await test('GET /nodes returns array', async () => {
    const nodes = await client.nodes.list()
    if (!Array.isArray(nodes)) throw new Error('Response is not an array')
    info(`${nodes.length} nodes in your account`)
    if (nodes.length > 0) {
      const n = nodes[0]!
      // The list endpoint may return summary objects; extract an id if present
      firstNodeId = n.id
    }
  })

  if (firstNodeId !== undefined) {
    await test(`GET /nodes/${firstNodeId} returns node detail`, async () => {
      const node = await client.nodes.get(firstNodeId!)
      info(`State: ${node.state}`)
      if (node.data.cpu_model_name) info(`CPU: ${node.data.cpu_model_name}`)
      if (node.location) info(`Location: ${node.location.city}, ${node.location.country}`)
    })
  } else {
    skip('no nodes in account — GET /nodes/{id} skipped')
  }
}

// 6. Services — available machines (read-only)
if (shouldRun('services')) {
  section('Services — available machines')

  await test('GET /services/mr returns MR machine list', async () => {
    const machines = await client.services.mr.available()
    if (!Array.isArray(machines)) throw new Error('Response is not an array')
    info(`${machines.length} MR machines available`)
    if (machines.length > 0) {
      const m = machines[0]!
      info(`Cheapest: node ${m.node_id} @ $${m.total_price_usd.toFixed(2)}/hr (${m.country})`)
      info(`GPU: ${m.is_has_gpu ? m.gpus.map((g) => g.model).join(', ') : 'none'}`)
    }
  })

  await test('GET /services/render returns render node list', async () => {
    const nodes = await client.services.render.available()
    if (!Array.isArray(nodes)) throw new Error('Response is not an array')
    info(`${nodes.length} render nodes available`)
    if (nodes.length > 0) {
      const n = nodes[0]!
      info(`Top CUDA score: ${n.blender_score} (node ${n.node_id})`)
    }
  })

  await test('GET /services/vpn returns VPN node list', async () => {
    const nodes = await client.services.vpn.available()
    if (!Array.isArray(nodes)) throw new Error('Response is not an array')
    info(`${nodes.length} VPN nodes available`)
    if (nodes.length > 0) {
      const n = nodes[0]!
      info(`First: ${n.city}, ${n.country} — $${n.traffic_price_usd}/GB`)
    }
  })
}

// 7. Sessions (active and recent)
if (shouldRun('sessions')) {
  section('Sessions')

  await test('GET /sessions returns active sessions', async () => {
    const sessions = await client.sessions.list()
    if (!Array.isArray(sessions)) throw new Error('Response is not an array')
    info(`${sessions.length} active sessions`)
    for (const s of sessions.slice(0, 3)) {
      info(`  ${s.uuid} — ${s.service} — node ${s.node_id} — ready: ${s.is_ready}`)
    }
  })

  await test('GET /sessions?recent=true returns recent sessions', async () => {
    const sessions = await client.sessions.list({ recent: true })
    if (!Array.isArray(sessions)) throw new Error('Response is not an array')
    info(`${sessions.length} recent sessions`)
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
