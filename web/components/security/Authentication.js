/**
 * Copyright 2022-2025 HEIG-VD
 * Licensed under the Apache License, Version 2.0
 */

import { useEffect, useRef, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import LoadingAnimation from '../feedback/Loading'
import LoginScreen from './LoginScreen'

const Authentication = ({ children }) => {
  const { status } = useSession()
  const eventSourceRef = useRef()
  const connectionSeqRef = useRef(0)

  const dispatchOnline = useCallback(() => {
    try {
      window.dispatchEvent(new Event('sse-online'))
    } catch {}
  }, [])

  const dispatchOffline = useCallback(() => {
    try {
      window.dispatchEvent(new Event('sse-offline'))
    } catch {}
  }, [])

  const handleOpen = useCallback(() => {
    console.log('[SSE] onopen at', new Date().toISOString())
    dispatchOnline()
  }, [dispatchOnline])

  const handleMessage = useCallback(
    (event) => {
      try {
        const data = JSON.parse(event.data)
        console.debug('[SSE] onmessage data:', data)
        if (data?.status === 'unauthenticated') {
          console.warn('[SSE] Server reported unauthenticated → signOut()')
          signOut()
        }
      } catch {
        // Ignore non-JSON (heartbeats/comments don’t hit onmessage anyway)
        // console.debug('[SSE] onmessage (non-JSON)')
      }
    },
    [signOut]
  )

  const handleError = useCallback(
    (es, err) => {
      console.warn('[SSE] onerror (auto-reconnect)', {
        when: new Date().toISOString(),
        readyState: es.readyState,
        type: err?.type,
      })
      dispatchOffline()
      // Do not close: EventSource auto-reconnects per server-sent retry
    },
    [dispatchOffline]
  )

  const openSSE = useCallback(() => {
    // Close previous connection if any
    if (eventSourceRef.current) {
      try {
        console.log('[SSE] Closing previous connection')
        eventSourceRef.current.close()
      } catch {}
      eventSourceRef.current = undefined
    }

    const connId = ++connectionSeqRef.current
    const url = '/api/session-sse'
    console.log(`[SSE#${connId}] Opening EventSource → ${url}`)

    const es = new EventSource(url)
    eventSourceRef.current = es

    es.onopen = () => {
      console.log(`[SSE#${connId}] OPEN at`, new Date().toISOString())
      handleOpen()
    }
    es.onmessage = (event) => {
      // Log sizes to avoid noisy console when payloads are large
      const size = typeof event?.data === 'string' ? event.data.length : 0
      console.debug(`[SSE#${connId}] MESSAGE (bytes=${size})`)
      handleMessage(event)
    }
    es.onerror = (err) => {
      console.warn(`[SSE#${connId}] ERROR`, {
        when: new Date().toISOString(),
        readyState: es.readyState,
        type: err?.type,
      })
      handleError(es, err)
    }
  }, [handleOpen, handleMessage, handleError])

  useEffect(() => {
    console.log('[Auth] status =', status)

    if (status !== 'authenticated') {
      // Ensure any previous connection is closed when leaving authenticated state
      if (eventSourceRef.current) {
        console.log('[SSE] Closing due to status change')
        try {
          eventSourceRef.current.close()
        } catch {}
        eventSourceRef.current = undefined
      }
      return
    }

    openSSE()

    const onRetry = () => {
      console.log('[SSE] Manual retry requested')
      openSSE()
    }
    window.addEventListener('sse-retry', onRetry)

    return () => {
      window.removeEventListener('sse-retry', onRetry)
      if (eventSourceRef.current) {
        console.log('[SSE] Cleanup: closing connection')
        try {
          eventSourceRef.current.close()
        } catch {}
        eventSourceRef.current = undefined
      }
    }
  }, [status, openSSE])

  return (
    <>
      {status === 'loading' && <LoadingAnimation />}
      {status === 'unauthenticated' && <LoginScreen />}
      {status === 'authenticated' && children}
    </>
  )
}

export default Authentication

