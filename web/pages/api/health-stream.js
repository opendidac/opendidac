/**
 * TEMP DIAGNOSTIC: Unauthenticated SSE-style stream used by the new-VM
 * migration health monitor to measure whether nginx maintains long-lived
 * streaming connections end-to-end.
 *
 * Sends a small JSON payload every second until the client disconnects.
 * Not added to the user-session SSE client registry, so it does not count
 * toward MAX_CONN and cannot affect real users.
 *
 * Defenses:
 *  - 404 unless HEALTH_STREAM_ENABLED=true is set in the environment.
 *  - One concurrent connection per IP (second attempt gets 429).
 *  - Hard server-side cap on connection duration (HARD_CAP_MS).
 *
 * REMOVE once the migration is validated.
 */

const HARD_CAP_MS = 5 * 60 * 1000

// Module-scoped: tracks one active response per client IP.
const activeByIP = new Map()

function clientIP(req) {
  const xff = req.headers['x-forwarded-for']
  if (typeof xff === 'string' && xff.length > 0) {
    return xff.split(',')[0].trim()
  }
  return req.socket?.remoteAddress || 'unknown'
}

export default function handler(req, res) {
  if (process.env.HEALTH_STREAM_ENABLED !== 'true') {
    res.status(404).end()
    return
  }

  const ip = clientIP(req)

  if (activeByIP.has(ip)) {
    res
      .status(429)
      .json({ error: 'one concurrent health-stream connection per IP' })
    return
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()
  try {
    res.socket?.setKeepAlive?.(true)
  } catch {}

  activeByIP.set(ip, res)

  res.write('retry: 3000\n\n')
  res.write(`: opened ${new Date().toISOString()}\n\n`)

  let n = 0
  const interval = setInterval(() => {
    n++
    try {
      res.write(`data: {"n":${n},"ts":"${new Date().toISOString()}"}\n\n`)
    } catch {}
  }, 1000)

  const hardCap = setTimeout(() => {
    try {
      res.end()
    } catch {}
  }, HARD_CAP_MS)

  const cleanup = () => {
    clearInterval(interval)
    clearTimeout(hardCap)
    if (activeByIP.get(ip) === res) {
      activeByIP.delete(ip)
    }
  }
  res.on('close', cleanup)
  res.on('finish', cleanup)
  req.on('aborted', cleanup)
}

export const config = {
  api: { bodyParser: false },
}
