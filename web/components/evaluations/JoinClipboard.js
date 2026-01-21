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

import { Paper, Stack, Typography, Box, Button, IconButton, Tooltip } from '@mui/material'
import { useState } from 'react'
import { useSnackbar } from '@/context/SnackbarContext'
import StatusDisplay from '@/components/feedback/StatusDisplay'
import DialogFeedback from '@/components/feedback/DialogFeedback'
import { getStudentEntryLink } from '@/core/utils'

const JoinClipboard = ({
  groupScope,
  evaluationId,
  desktopAppRequired = false,
  pin,
  onPinUpdated,
}) => {
  const [refreshStatus, setRefreshStatus] = useState('RELOAD')
  const [dialogOpen, setDialogOpen] = useState(false)
  const { show: showSnackbar } = useSnackbar()

  const textToDisplay = desktopAppRequired
    ? pin || 'Missing PIN'
    : getStudentEntryLink(evaluationId)
  const prefix = desktopAppRequired ? 'PIN' : 'URL'

  const regeneratePin = async () => {
    setRefreshStatus('LOADING')
    try {
      const response = await fetch(
        `/api/${groupScope}/evaluations/${evaluationId}/regenerate-pin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      )

      const data = await response.json()

      if (response.ok) {
        setRefreshStatus('SUCCESS')
        showSnackbar('PIN regenerated successfully', 'success')
        // Call callback to update PIN in parent component
        if (onPinUpdated) {
          onPinUpdated(data.pin)
        }
        // Reset to RELOAD after 2 seconds
        setTimeout(() => {
          setRefreshStatus('RELOAD')
        }, 2000)
      } else {
        setRefreshStatus('RELOAD')
        showSnackbar(data.message || 'Error regenerating PIN', 'error')
      }
    } catch (error) {
      setRefreshStatus('RELOAD')
      showSnackbar('Error regenerating PIN', 'error')
    }
  }

  const onClick = async () => {
    // Only copy if there's actual content (PIN or URL)
    if (desktopAppRequired && pin) {
      await navigator.clipboard.writeText(pin)
    } else if (!desktopAppRequired) {
      await navigator.clipboard.writeText(getStudentEntryLink(evaluationId))
    }
  }

  return (
    <Paper variant="outlined">
        <Stack direction="row" spacing={2} alignItems="center" flex={1}>
          <Box
            sx={{
              backgroundColor: 'grey.300',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <Typography variant="caption" fontWeight="medium">
              {prefix}
            </Typography>
            {desktopAppRequired && (
              <Tooltip title="Regenerate PIN">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDialogOpen(true)
                  }}
                  sx={{ 
                    padding: 0.25,
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  <StatusDisplay status={refreshStatus} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <Stack flex={1}>
            <Typography variant="body2" size="small">
              {textToDisplay}
            </Typography>
        </Stack> 
        <Button
          onClick={onClick}
          variant="text"
          color="primary"
          size="small"
        >
          Copy
        </Button>
        </Stack>
      <DialogFeedback
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={() => {
          setDialogOpen(false)
          regeneratePin()
        }}
        title="Regenerate PIN"
        content={
          <Stack spacing={2}>
            <Typography variant="body1">
              Are you sure you want to regenerate the PIN for this evaluation?
            </Typography>
            <Typography variant="body2">
              The current PIN will be replaced with a new one. Students who have
              already received the current PIN will need to use the new PIN to join.
            </Typography>
            <Typography variant="body2">
              This wont affect the students who have already joined the evaluation.
            </Typography>
            {pin && (
              <Typography variant="body2" color="text.secondary">
                Current PIN: <strong>{pin || 'Missing PIN'}</strong>
              </Typography>
            )}
          </Stack>
        }
      />
    </Paper>
  )
}

export default JoinClipboard
