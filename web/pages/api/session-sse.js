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
import { getUser } from '@/code/auth/auth'
import {
  addSSEClient,
  sseControl,
  startSSEHeartbeat,
  sseSend,
} from '@/code/auth/sseClients'

export default async function handler(req, res) {
  console.log('Opening SSE connection')

  // --- SSE / proxy-friendly headers ---
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  // Helpful for nginx/ingress to disable buffering
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  // Keep TCP alive if supported
  try {
    res.socket?.setKeepAlive?.(true)
  } catch {
    // ignore
  }

  // Authenticate user
  const user = await getUser(req, res)
  if (!user) {
    try {
      sseSend(res, { data: { status: 'unauthenticated' } })
    } finally {
      res.end()
    }
    return
  }

  // Control lines (not JSON): reconnection delay + initial comment
  sseControl(res, { retry: 3000, comment: 'open' })

  // Heartbeat to keep connection alive
  const heartbeat = startSSEHeartbeat(res)

  const cleanup = () => {
    clearInterval(heartbeat)
  }
  res.on('close', cleanup)
  res.on('finish', cleanup)
  req.on('aborted', cleanup)

  // Register the client
  addSSEClient(user.id, res)
}

// Ensure Node runtime (not Edge)
export const config = {
  api: {
    bodyParser: false,
  },
}
