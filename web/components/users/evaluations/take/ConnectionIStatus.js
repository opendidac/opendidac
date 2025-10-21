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
import React, { useState, useEffect } from 'react'
import StatusDisplay from '../../../feedback/StatusDisplay'
import { Tooltip, Typography } from '@mui/material'

const connectionQuality = {
  'WIFI-FULL': {
    effectiveType: ['4g'],
    tooltip: 'Your connection is excellent',
  },
  'WIFI-GOOD': {
    effectiveType: ['3g'],
    tooltip: 'Your connection is good',
  },
  'WIFI-POOR': {
    effectiveType: ['2g', 'slow-2g'],
    tooltip: 'Your connection is poor',
  },
  'WIFI-OFF': {
    tooltip: 'You are offline',
  },
}

const ConnectionIndicator = () => {
  const [compatible, setCompatible] = useState(false)
  const [connectionInfo, setConnectionInfo] = useState({
    isOnline: navigator.onLine,
    effectiveType: '',
    rtt: 0,
    downlink: 0,
  })

  useEffect(() => {
    const updateConnectionInfo = () => {
      setConnectionInfo({
        isOnline: navigator.onLine,
        effectiveType: navigator.connection?.effectiveType || '',
        rtt: navigator.connection?.rtt || 0,
        downlink: navigator.connection?.downlink || 0,
      })
    }

    // Check if the browser supports the Network Information API
    setCompatible(!!navigator.connection)

    updateConnectionInfo()

    if (!window) return

    window.addEventListener('online', updateConnectionInfo)
    window.addEventListener('offline', updateConnectionInfo)
    navigator.connection?.addEventListener('change', updateConnectionInfo)

    return () => {
      window.removeEventListener('online', updateConnectionInfo)
      window.removeEventListener('offline', updateConnectionInfo)
      navigator.connection?.removeEventListener('change', updateConnectionInfo)
    }
  }, [])

  const getStatus = () => {
    if (!connectionInfo.isOnline) return 'WIFI-OFF'
    if (!compatible) return null
    const qualityStatus = Object.keys(connectionQuality).find((status) => {
      const que = connectionQuality[status]
      return que.effectiveType?.includes(connectionInfo.effectiveType)
    })
    return qualityStatus || 'WIFI-POOR'
  }

  const getTooltip = () => {
    if (!connectionInfo.isOnline) return 'You are offline'
    if (!compatible) return null
    const qualityStatus = Object.keys(connectionQuality).find((status) => {
      const que = connectionQuality[status]
      return que.effectiveType?.includes(connectionInfo.effectiveType)
    })
    return (
      connectionQuality[qualityStatus]?.tooltip || 'Your connection is poor'
    )
  }

  return compatible || !connectionInfo.isOnline ? (
    <Tooltip title={getTooltip()} placement="bottom">
      <Typography>
        <StatusDisplay size={18} status={getStatus()} />
      </Typography>
    </Tooltip>
  ) : null
}

export default ConnectionIndicator
