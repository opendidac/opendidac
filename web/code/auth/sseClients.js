/**
 * Copyright 2022-2024 HEIG-VD
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { getPrisma } from '@/middleware/withPrisma'

export const MAX_CONN = 5

// Map<userId, Set<ServerResponse>>
const __clients = new Map()

function sseSend(res, { event, id, data }) {
  if (!res || res.writableEnded || res.destroyed) {
    return false
  }
  if (id) res.write(`id: ${id}\n`)
  if (event) res.write(`event: ${event}\n`)
  const payload = typeof data === 'string' ? data : JSON.stringify(data)
  for (const line of payload.split('\n')) res.write(`data: ${line}\n`)
  res.write('\n')
  return true
}

function sseControl(res, { retry, comment } = {}) {
  if (!res || res.writableEnded || res.destroyed) return false
  if (typeof retry === 'number') res.write(`retry: ${retry}\n\n`)
  if (comment) res.write(`: ${comment}\n\n`)
  return true
}

function startSSEHeartbeat(res, intervalMs = 60000) {
  const id = setInterval(() => {
    try {
      res.write(`: ping\n\n`)
    } catch {}
  }, intervalMs)
  return id
}

async function logConnectedClients(action, userId) {
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
    console.log(
      `Action: ${action} - ${current?.email || 'Unknown'} (id=${userId})`,
    )
    if (users.length) {
      users.forEach((u) => {
        const count = __clients.get(u.id)?.size || 0
        console.log(`  - ${u.email} (connections=${count})`)
      })
    } else {
      console.log(`  No connected clients.`)
    }
    console.log(`===========================\n`)
  } catch (e) {
    console.warn('SSE log error:', e?.message || e)
  }
}

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

function removeSSEClient(userId, res) {
  const set = __clients.get(userId)
  if (!set) return
  set.delete(res)

  // If we dropped under cap, broadcast that slots are available again
  if (set.size < MAX_CONN) {
    try {
      notifySSEClients(
        userId,
        {
          status: 'connection_slots_available',
          max: MAX_CONN,
          current: set.size,
        },
        undefined,
      )
    } catch {}
  }

  if (set.size === 0) __clients.delete(userId)
  logConnectedClients('Removed', userId)
}

function getSSEClients(userId) {
  return __clients.get(userId) || new Set()
}

function getAllSSEClients() {
  return __clients
}

/**
 * Broadcast a message to all active SSE connections for a user.
 */
function notifySSEClients(userId, message, eventName) {
  const set = __clients.get(userId)
  if (!set) return
  const dead = []
  for (const res of set) {
    if (!res || res.writableEnded || res.destroyed) {
      dead.push(res)
      continue
    }
    const ok = sseSend(res, { event: eventName, data: message })
    if (!ok) dead.push(res)
  }
  if (dead.length) for (const res of dead) removeSSEClient(userId, res)
  logConnectedClients('Notified', userId)
}

/**
 * HARD INVALIDATION:
 * - Sends an 'unauthenticated' payload to every connection for userId
 * - Closes each response (res.end())
 * - Purges all references synchronously (don’t wait for 'close' events)
 */
function invalidateSSEClients(userId, reason = 'unauthenticated') {
  const set = __clients.get(userId)
  if (!set || set.size === 0) return

  console.log(
    `[SSE] Invalidate: ending ${set.size} connections for user=${userId}`,
  )

  for (const res of Array.from(set)) {
    try {
      sseSend(res, { data: { status: reason } })
    } catch {}
    try {
      res.end()
    } catch {}
    // Remove immediately; don't wait for 'close' to fire
    try {
      set.delete(res)
    } catch {}
  }

  if (set.size === 0) __clients.delete(userId)
  logConnectedClients('Invalidated', userId)
}

export {
  addSSEClient,
  removeSSEClient,
  getSSEClients,
  getAllSSEClients,
  notifySSEClients,
  invalidateSSEClients, // 👈 export new hard-kill helper
  sseSend,
  sseControl,
  startSSEHeartbeat,
}
