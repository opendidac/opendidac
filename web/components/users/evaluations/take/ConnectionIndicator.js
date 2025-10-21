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
import { Stack, Typography } from '@mui/material'

const ConnectionIndicator = () => {
  const [isOnline, setIsOnline] = useState(false)

  const setOnline = () => setIsOnline(true)
  const setOffline = () => setIsOnline(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    window.addEventListener('online', setOnline)
    window.addEventListener('offline', setOffline)

    return () => {
      window.removeEventListener('online', setOnline)
      window.removeEventListener('offline', setOffline)
    }
  }, [])

  return (
    <Stack
      display={isOnline ? 'none' : 'flex'}
      direction="row"
      alignItems="center"
      spacing={1}
    >
      <StatusDisplay size={18} status={isOnline ? 'WIFI-ON' : 'WIFI-OFF'} />
      <Typography
        variant="caption"
        color={isOnline ? 'success' : 'error'}
        noWrap
      >
        {isOnline ? 'Online' : 'Connection lost'}
      </Typography>
    </Stack>
  )
}

export default ConnectionIndicator
