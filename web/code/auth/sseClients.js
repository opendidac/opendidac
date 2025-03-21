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

/**
 * Global store for SSE client connections.
 * Map structure: userId -> Set of response objects
 * Each user can have multiple active connections (multiple tabs/browsers)
 */
const __clients = new Map()


/**
 * Logs the current state of SSE connections for debugging purposes.
 * Shows which users are connected and what actions are being performed.
 *
 * @param {string} action - The action being performed (Added/Removed/Notified)
 * @param {string} userId - The ID of the user involved in the action
 */
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

/**
 * Adds a new SSE client connection for a user.
 * Sets up connection cleanup when the client disconnects.
 * Multiple connections per user are supported (e.g., multiple browser tabs).
 *
 * @param {string} userId - The ID of the user establishing the connection
 * @param {object} res - The response object representing the SSE connection
 */
export function addSSEClient(userId, res) {
  if (!__clients.has(userId)) {
    __clients.set(userId, new Set())
  }
  __clients.get(userId).add(res)

  // Automatically remove client when connection closes (browser close/navigation)

  res.on('close', () => {
    removeSSEClient(userId, res)
  })

  logConnectedClients('Added', userId)
}

/**
 * Removes an SSE client connection.
 * If this was the user's last connection, removes the user entry entirely.
 *
 * @param {string} userId - The ID of the user whose connection is being removed
 * @param {object} res - The response object representing the SSE connection to remove
 */
function removeSSEClient(userId, res) {
  if (__clients.has(userId)) {
    const connections = __clients.get(userId)
    connections.delete(res)
    if (connections.size === 0) {
      __clients.delete(userId) // Clean up user entry if no active connections remain
    }
    logConnectedClients('Removed', userId)
  }
}

/**
 * Retrieves all active SSE connections for a specific user.
 *
 * @param {string} userId - The ID of the user
 * @returns {Set} A Set of response objects for the user's active connections
 */
export function getSSEClients(userId) {
  return __clients.get(userId) || new Set()
}

/**
 * Returns the entire client connection map.
 * Useful for system-wide notifications or debugging.
 *
 * @returns {Map} The map of all active SSE connections
 */
export function getAllSSEClients() {
  return __clients
}

/**
 * Sends a message to all active connections for a specific user.
 * Handles dead connection cleanup if message delivery fails.
 *
 * @param {string} userId - The ID of the user to notify
 * @param {object} message - The message to send (will be JSON stringified)
 */
export function notifySSEClients(userId, message) {
  if (__clients.has(userId)) {
    const connections = __clients.get(userId)
    const deadConnections = new Set()

    // Attempt to send message to each client connection

    for (const res of connections) {
      try {
        res.write(`data: ${JSON.stringify(message)}\n\n`)
      } catch (error) {
        // Track failed connections for cleanup
        deadConnections.add(res)
      }
    }

    // Clean up any connections that failed to receive the message

    if (deadConnections.size > 0) {
      for (const res of deadConnections) {
        removeSSEClient(userId, res)
      }
    }

    logConnectedClients('Notified', userId)
  }
}
