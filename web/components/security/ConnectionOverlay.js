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
import React from 'react'
import { Box, Stack, Typography, Button } from '@mui/material'
import Overlay from '@/components/ui/Overlay'
import StatusDisplay from '@/components/feedback/StatusDisplay'

const ConnectionOverlay = ({
  icon = 'WIFI-OFF',
  title = 'Connection lost',
  message = 'We need a live connection to continue.',
  actionLabel = 'Retry',
  onAction,
  busy = false,
}) => {
  return (
    <Overlay>
      <Box tabIndex={-1} style={{ outline: 'none' }}>
        <Stack alignItems="center" spacing={2} justifyContent="center">
          <StatusDisplay size={96} status={icon} />
          <Typography variant="h4" color="error">
            {title}
          </Typography>
          {message && (
            <Typography variant="body1" color="text.secondary" align="center">
              {message}
            </Typography>
          )}
          {onAction && (
            <Button variant="contained" onClick={onAction} disabled={busy}>
              {busy ? 'Reconnecting…' : actionLabel}
            </Button>
          )}
        </Stack>
      </Box>
    </Overlay>
  )
}

export default ConnectionOverlay
