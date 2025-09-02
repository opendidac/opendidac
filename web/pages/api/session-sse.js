/**
 * Copyright 2022-2025 HEIG-VD
 * Licensed under the Apache License, Version 2.0
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
