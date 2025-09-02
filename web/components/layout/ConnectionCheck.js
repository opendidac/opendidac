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
import React, { useState, useEffect, useRef } from 'react'
import { Box, Stack, Typography, Button } from '@mui/material'
import Overlay from '../ui/Overlay'
import StatusDisplay from '../feedback/StatusDisplay'
import SyncIcon from '@mui/icons-material/Sync'

const OFFLINE_DEBOUNCE_MS = 1000 // avoid flicker during brief reconnects

const ConnectionCheck = () => {
  const [isOnline, setIsOnline] = useState(true)
  const [cooldown, setCooldown] = useState(0)
  const overlayRef = useRef(null)
  const offlineTimerRef = useRef(null)
  const cooldownTimerRef = useRef(null)

  const startCooldown = () => {
    setCooldown(3)
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

  const handleRetry = () => {
    if (cooldown > 0) return
    try {
      window.dispatchEvent(new Event('sse-retry'))
    } catch {}
    startCooldown()
  }

  // Browser online/offline signals as a baseline
  useEffect(() => {
    const setOnline = () => {
      clearTimeout(offlineTimerRef.current)
      setIsOnline(true)
    }
    const setOffline = () => {
      clearTimeout(offlineTimerRef.current)
      offlineTimerRef.current = setTimeout(() => setIsOnline(false), OFFLINE_DEBOUNCE_MS)
    }

    if (navigator.onLine) setOnline()
    else setOffline()

    window.addEventListener('online', setOnline)
    window.addEventListener('offline', setOffline)

    // SSE-driven connectivity
    const onSseOnline = () => setOnline()
    const onSseOffline = () => setOffline()
    window.addEventListener('sse-online', onSseOnline)
    window.addEventListener('sse-offline', onSseOffline)

    return () => {
      clearTimeout(offlineTimerRef.current)
      clearInterval(cooldownTimerRef.current)
      window.removeEventListener('online', setOnline)
      window.removeEventListener('offline', setOffline)
      window.removeEventListener('sse-online', onSseOnline)
      window.removeEventListener('sse-offline', onSseOffline)
    }
  }, [])

  useEffect(() => {
    if (!isOnline && overlayRef.current) {
      overlayRef.current.focus()
    }
  }, [isOnline])

  return (
    <>
      {!isOnline && (
        <Overlay>
          <Box ref={overlayRef} tabIndex={-1} style={{ outline: 'none' }}>
            <Stack alignItems={'center'} spacing={2} justifyContent={'center'}>
              <StatusDisplay size={96} status={'WIFI-OFF'} />
              <Typography variant="h4" color="error">
                Connection lost
              </Typography>
              <Button
                variant="text"
                color="primary"
                onClick={handleRetry}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleRetry()
                }}
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

export default ConnectionCheck
