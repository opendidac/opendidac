/**
 * Copyright 2022-2024 HEIG-VD
 * Apache 2.0
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
          <Typography variant="h4" color="error">{title}</Typography>
          {message && (
            <Typography variant="body1" color="text.secondary" align="center">
              {message}
            </Typography>
          )}
          {onAction && (
            <Button
              variant="contained"
              onClick={onAction}
              disabled={busy}
            >
              {busy ? 'Reconnecting…' : actionLabel}
            </Button>
          )}
        </Stack>
      </Box>
    </Overlay>
  )
}

export default ConnectionOverlay
