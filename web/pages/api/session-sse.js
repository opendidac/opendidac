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

import { getUser } from '@/core/auth/auth'
import {
  addSSEClient,
  getSSEClients,
  notifySSEClients,
  sseControl,
  startSSEHeartbeat,
  sseSend,
  MAX_CONN,
} from '@/core/auth/sseClients'

export default async function handler(req, res) {
  console.log('Opening SSE connection')

  // 1) Authenticate FIRST — do NOT switch to SSE unless authenticated
  const user = await getUser(req, res)
  if (!user) {
    // Plain 401 JSON (no SSE auto-reconnect semantics)
    res.status(401).json({ status: 'unauthenticated' })
    return
  }

  // 2) Now upgrade to SSE (proxy-friendly headers)
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()
  try {
    res.socket?.setKeepAlive?.(true)
  } catch {}

  // Enforce per-user max connections
  const existing = getSSEClients(user.id)
  if (existing.size >= MAX_CONN) {
    // Notify already-connected tabs to show the limit overlay
    try {
      notifySSEClients(
        user.id,
        {
          status: 'too_many_connections_active',
          max: MAX_CONN,
          current: existing.size,
        },
        undefined, // default "message" event
      )
    } catch {}

    // Slow auto-retry on the refused tab and explain why
    sseControl(res, { retry: 60000, comment: 'too-many-connections' })
    sseSend(res, { data: { status: 'too_many_connections', max: MAX_CONN } })
    res.end()
    return
  }

  // Normal path
  sseControl(res, { retry: 3000, comment: 'open' })
  const heartbeat = startSSEHeartbeat(res)

  const cleanup = () => clearInterval(heartbeat)
  res.on('close', cleanup)
  res.on('finish', cleanup)
  req.on('aborted', cleanup)

  addSSEClient(user.id, res)
}

export const config = {
  api: { bodyParser: false },
}
