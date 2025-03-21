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

const __clients = new Map() // Stores userId -> Set(res)

async function logConnectedClients(action, userId) {
  const prisma = getPrisma()

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })
  // Fetch emails for connected users
  const userIds = Array.from(__clients.keys())
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true },
  })

  console.log(`\n=== SSE Clients Update ===`)
  console.log(`📢 Action: ${action} - User Email: ${user?.email || 'Unknown'}`)

  if (users.length > 0) {
    console.log(`🔗 Currently Connected Clients:`)
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email}`)
    })
  } else {
    console.log(`❌ No connected clients.`)
  }

  console.log(`===========================\n`)
}

export function addSSEClient(userId, res) {
  if (!__clients.has(userId)) {
    __clients.set(userId, new Set())
  }
  __clients.get(userId).add(res)

  // Handle client disconnection
  res.on('close', () => {
    removeSSEClient(userId, res)
  })

  logConnectedClients('Added', userId)
}

export function removeSSEClient(userId, res) {
  if (__clients.has(userId)) {
    const connections = __clients.get(userId)
    connections.delete(res)
    if (connections.size === 0) {
      __clients.delete(userId) // Remove user entry if no connections remain
    }
    logConnectedClients('Removed', userId)
  }
}

export function getSSEClients(userId) {
  return __clients.get(userId) || new Set()
}

export function getAllSSEClients() {
  return __clients
}

export function notifySSEClients(userId, message) {
  if (__clients.has(userId)) {
    const connections = __clients.get(userId)
    const deadConnections = new Set()

    // Try to send to each client and track failed ones
    for (const res of connections) {
      try {
        res.write(`data: ${JSON.stringify(message)}\n\n`)
      } catch (error) {
        // If writing fails, mark connection for removal
        deadConnections.add(res)
      }
    }

    // Clean up dead connections
    if (deadConnections.size > 0) {
      for (const res of deadConnections) {
        removeSSEClient(userId, res)
      }
    }

    logConnectedClients('Notified', userId)
  }
}
