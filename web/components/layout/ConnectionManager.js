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

/**
 * Mounted only when authenticated.
 * - Opens SSE (singleton per tab) on mount, closes when last owner unmounts
 * - Overlays: too many tabs / connection lost
 * - Dispatches only 'auth-unauthenticated' to trigger signOut in Authentication
 */
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Box, Stack, Typography, Button } from '@mui/material'
import Overlay from '../ui/Overlay'
import StatusDisplay from '../feedback/StatusDisplay'
import SyncIcon from '@mui/icons-material/Sync'

const OFFLINE_DEBOUNCE_MS = 1200
const RETRY_COOLDOWN_SEC = 3
const SSE_URL = '/api/session-sse'

/**
 * Ensure a container on window to store the singleton.
 * shape: { es: EventSource|null, owners: number, stopped: boolean }
 */
function getSSEGlobal() {
  if (typeof window === 'undefined') return null
  if (!window.__APP_SSE) {
    window.__APP_SSE = { es: null, owners: 0, stopped: false }
  }
  return window.__APP_SSE
}

export default function ConnectionManager() {
  const { status } = useSession()
  const esRef = useRef(null)
  const overlayRef = useRef(null)

  // UI state
  const [isOnline, setIsOnline] = useState(true)
  const [cooldown, setCooldown] = useState(0)
  const [denied, setDenied] = useState(null) // { max }
  const [limit, setLimit] = useState(null) // { max, current }

  // timers
  const offlineTimerRef = useRef(null)
  const cooldownTimerRef = useRef(null)

  const setOnline = useCallback(() => {
    clearTimeout(offlineTimerRef.current)
    setIsOnline(true)
    setDenied(null)
  }, [])

  const setOffline = useCallback(() => {
    clearTimeout(offlineTimerRef.current)
    offlineTimerRef.current = setTimeout(
      () => setIsOnline(false),
      OFFLINE_DEBOUNCE_MS,
    )
  }, [])

  const startCooldown = () => {
    setCooldown(RETRY_COOLDOWN_SEC)
    clearInterval(cooldownTimerRef.current)
    cooldownTimerRef.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          clearInterval(cooldownTimerRef.current)
          return 0
        }
        return s - 1
      })
    }, 1000)
  }

  const attachHandlers = useCallback(
    (es) => {
      // Replace handlers with this component's handlers (we’re the active owner)
      es.onopen = () => {
        setOnline()
      }
      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data)

          if (data?.status === 'unauthenticated') {
            // Tell Authentication to sign out and stop the singleton
            try {
              window.dispatchEvent(new CustomEvent('auth-unauthenticated'))
            } catch {}
            const g = getSSEGlobal()
            if (g) {
              g.stopped = true
              try {
                g.es?.close()
              } catch {}
              g.es = null
            }
            return
          }

          if (data?.status === 'too_many_connections') {
            setDenied({ max: data?.max ?? 5 })
            setIsOnline(false)
            return
          }

          if (data?.status === 'too_many_connections_active') {
            setLimit({
              max: data?.max ?? 5,
              current: data?.current ?? undefined,
            })
            return
          }

          if (data?.status === 'connection_slots_available') {
            setLimit(null)
            return
          }
        } catch {
          // ignore non-JSON
        }
      }
      es.onerror = () => {
        // Do not close; let ES follow server retry/backoff.
        // We still show a debounced "Connection lost" overlay.
        setOffline()
      }
    },
    [setOnline, setOffline],
  )

  const ensureSingletonOpen = useCallback(() => {
    const g = getSSEGlobal()
    if (!g) return null
    if (g.stopped) return null // do not reopen after unauthenticated until remount

    // If already open, reuse it and just re-attach handlers
    if (g.es) {
      attachHandlers(g.es)
      return g.es
    }

    // Create a fresh ES with a cache-busting query to avoid proxy reuse
    const url = `${SSE_URL}?t=${Date.now()}`
    const es = new EventSource(url)
    g.es = es
    attachHandlers(es)
    return es
  }, [attachHandlers])

  const acquire = useCallback(() => {
    const g = getSSEGlobal()
    if (!g) return null
    g.owners += 1
    const es = ensureSingletonOpen()
    esRef.current = es
    return es
  }, [ensureSingletonOpen])

  const release = useCallback(() => {
    const g = getSSEGlobal()
    if (!g) return
    g.owners = Math.max(0, g.owners - 1)
    // Only close the ES if *no* owners remain and we’re not in stopped mode.
    if (g.owners === 0 && g.es && !g.stopped) {
      try {
        g.es.close()
      } catch {}
      g.es = null
    }
  }, [])

  const handleRetry = () => {
    if (cooldown > 0) return
    const g = getSSEGlobal()
    if (!g) return
    if (g.stopped) {
      // If we were stopped due to unauthenticated, do nothing; Authentication will unmount us.
      return
    }
    // Force reopen: close existing ES and open a new one
    try {
      g.es?.close()
    } catch {}
    g.es = null
    ensureSingletonOpen()
    startCooldown()
  }

  // Only run when authenticated; on unauthenticated this component is unmounted by Authentication
  useEffect(() => {
    if (status !== 'authenticated') {
      // Make sure we drop our ownership; do not forcibly close ES here,
      // because another ConnectionManager (in another route) might still be mounted.
      release()
      return
    }

    // Baseline browser connectivity
    if (navigator.onLine) setOnline()
    else setOffline()

    acquire()

    const onOnline = () => setOnline()
    const onOffline = () => setOffline()
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      clearTimeout(offlineTimerRef.current)
      clearInterval(cooldownTimerRef.current)
      release()
    }
  }, [status, acquire, release, setOnline, setOffline])

  // a11y: focus overlay when visible
  useEffect(() => {
    if ((!isOnline || denied || limit) && overlayRef.current) {
      overlayRef.current.focus()
    }
  }, [isOnline, denied, limit])

  const showOverlay = !!denied || !!limit || !isOnline
  const isLimit = !!limit && !denied

  return (
    <>
      {showOverlay && (
        <Overlay>
          <Box ref={overlayRef} tabIndex={-1} style={{ outline: 'none' }}>
            <Stack alignItems="center" spacing={2} justifyContent="center">
              <StatusDisplay
                size={96}
                status={denied || isLimit ? 'WARNING' : 'WIFI-OFF'}
              />
              <Typography variant="h4" color="error" align="center">
                {denied || isLimit ? 'Too many tabs open' : 'Connection lost'}
              </Typography>
              {(denied || isLimit) && (
                <Typography variant="body1" align="center">
                  You can have up to {denied?.max ?? limit?.max ?? 5} active
                  sessions for this account. Close another tab/window and then
                  retry.
                </Typography>
              )}
              <Button
                variant="text"
                color="primary"
                onClick={handleRetry}
                aria-label="Retry connection"
                autoFocus
                disabled={cooldown > 0}
                startIcon={cooldown > 0 ? null : <SyncIcon />}
              >
                {cooldown > 0 ? `${cooldown}` : 'Retry'}
              </Button>
            </Stack>
          </Box>
        </Overlay>
      )}
    </>
  )
}
