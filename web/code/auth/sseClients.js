/**
 * Copyright 2022-2025 HEIG-VD
 * Licensed under the Apache License, Version 2.0
 */

import { getPrisma } from '@/middleware/withPrisma'

/**
 * In-memory store of active SSE connections.
 * Map<userId, Set<ServerResponse>>
 */
const __clients = new Map()

/** Robust SSE writer (supports JSON or string, event, id) */
function sseSend(res, { event, id, data }) {
  if (!res || res.writableEnded || res.destroyed) {
    throw new Error('SSE response is closed')
  }

  if (id) res.write(`id: ${id}\n`)
  if (event) res.write(`event: ${event}\n`)

  const payload = typeof data === 'string' ? data : JSON.stringify(data)

  for (const line of payload.split('\n')) {
    res.write(`data: ${line}\n`)
  }
  res.write('\n')
}

/** Control lines: retry + comments */
function sseControl(res, { retry, comment } = {}) {
  if (!res || res.writableEnded || res.destroyed) return false
  let wrote = false

  if (typeof retry === 'number') {
    res.write(`retry: ${retry}\n\n`)
    wrote = true
  }
  if (comment) {
    res.write(`: ${comment}\n\n`)
    wrote = true
  }
  return wrote
}

/** Heartbeat using SSE comments */
function startSSEHeartbeat(res, intervalMs = 60000) {
  const id = setInterval(() => {
    try {
      res.write(`: ping\n\n`)
    } catch {
      // will be cleaned up on close
    }
  }, intervalMs)
  return id
}

/** Dev-only logging */
async function logConnectedClients(action, userId) {
  if (process.env.NODE_ENV === 'production') return
  try {
    const prisma = getPrisma()
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })

    const userIds = Array.from(__clients.keys())
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, email: true },
        })
      : []

    console.log(`\n=== SSE Clients Update ===`)
    console.log(`📢 Action: ${action} - User Email: ${current?.email || 'Unknown'}`)
    if (users.length) {
      console.log(`🔗 Currently Connected Clients:`)
      users.forEach((u, i) => console.log(`  ${i + 1}. ${u.email}`))
    } else {
      console.log(`❌ No connected clients.`)
    }
    console.log(`===========================\n`)
  } catch (e) {
    console.warn('SSE log error:', e?.message || e)
  }
}

/** Add a new client */
function addSSEClient(userId, res) {
  if (!__clients.has(userId)) __clients.set(userId, new Set())
  const set = __clients.get(userId)
  set.add(res)

  const onClose = () => removeSSEClient(userId, res)
  res.on('close', onClose)
  res.on('finish', onClose)
  res.on('error', onClose)

  logConnectedClients('Added', userId)
}

/** Remove a client */
function removeSSEClient(userId, res) {
  const set = __clients.get(userId)
  if (!set) return

  set.delete(res)
  if (set.size === 0) __clients.delete(userId)

  logConnectedClients('Removed', userId)
}

/** Get connections for a user */
function getSSEClients(userId) {
  return __clients.get(userId) || new Set()
}

/** Get all connections */
function getAllSSEClients() {
  return __clients
}

/** Notify all clients of a user */
function notifySSEClients(userId, message, eventName) {
  const set = __clients.get(userId)
  if (!set) return

  const dead = []
  for (const res of set) {
    if (!res || res.writableEnded || res.destroyed) {
      dead.push(res)
      continue
    }
    try {
      sseSend(res, { event: eventName, data: message })
    } catch {
      dead.push(res)
    }
  }

  if (dead.length) {
    for (const res of dead) removeSSEClient(userId, res)
  }

  logConnectedClients('Notified', userId)
}

export {
  addSSEClient,
  getSSEClients,
  getAllSSEClients,
  notifySSEClients,
  // helpers
  sseSend,
  sseControl,
  startSSEHeartbeat,
}
