/**
 * TEMP DIAGNOSTIC: Unauthenticated SSE-style stream used by the new-VM
 * migration health monitor to measure whether nginx maintains long-lived
 * streaming connections end-to-end.
 *
 * Sends a small JSON payload every second until the client disconnects.
 * Not added to the user-session SSE client registry, so it does not count
 * toward MAX_CONN and cannot affect real users.
 *
 * REMOVE once the migration is validated.
 */

export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()
  try {
    res.socket?.setKeepAlive?.(true)
  } catch {}

  res.write('retry: 3000\n\n')
  res.write(`: opened ${new Date().toISOString()}\n\n`)

  let n = 0
  const interval = setInterval(() => {
    n++
    try {
      res.write(`data: {"n":${n},"ts":"${new Date().toISOString()}"}\n\n`)
    } catch {}
  }, 1000)

  const cleanup = () => clearInterval(interval)
  res.on('close', cleanup)
  res.on('finish', cleanup)
  req.on('aborted', cleanup)
}

export const config = {
  api: { bodyParser: false },
}
