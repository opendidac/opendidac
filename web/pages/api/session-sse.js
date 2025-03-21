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
import { addSSEClient } from '@/code/auth/sseClients'

export default async function handler(req, res) {
  console.log('Opening SSE connection')

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  // Get user session
  const user = await getUser(req, res)
  if (!user) {
    res.write(`data: ${JSON.stringify({ status: 'unauthenticated' })}\n\n`)
    res.end()
    return
  }

  // Store the client connection, the close handler is managed in sseClients.js
  addSSEClient(user.id, res)
}
