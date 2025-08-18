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
import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  TextField,
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useSnackbar } from '@/context/SnackbarContext'
import AlertFeedback from '@/components/feedback/AlertFeedback'

const ArchiveEvaluationDialog = ({ 
  open, 
  onClose, 
  evaluation,
  onSuccess 
}) => {
  const { show: showSnackbar } = useSnackbar()
  const [archiveBusy, setArchiveBusy] = useState(false)
  const [archiveDate, setArchiveDate] = useState('')

  const handleArchive = async () => {
    setArchiveBusy(true)
    try {
      const res = await fetch(
        `/api/admin/archive/${evaluation.id}/archive`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Accept: 'application/json' 
          },
          body: JSON.stringify({ 
            archiveDate: archiveDate || null 
          }),
        },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Failed to archive')
      showSnackbar('Evaluation archived successfully', 'success')
      onClose()
      onSuccess?.()
    } catch (err) {
      showSnackbar(err.message || 'Archive failed', 'error')
    } finally {
      setArchiveBusy(false)
    }
  }

  const handleClose = () => {
    if (!archiveBusy) {
      setArchiveDate('')
      onClose()
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Archive Evaluation
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={2}>
          <AlertFeedback severity="info">
            <Typography variant="body2">
              <strong>{evaluation?.label || 'Unnamed evaluation'}</strong>
            </Typography>
            <Typography variant="body2">
              Group: {evaluation?.group?.label}
            </Typography>
          </AlertFeedback>

          <AlertFeedback severity="warning">
            This will mark the evaluation as archived. The evaluation will still
            be accessible but will be clearly marked as archived.
          </AlertFeedback>

          <TextField
            label="Archive Date (optional)"
            type="datetime-local"
            value={archiveDate}
            onChange={(e) => setArchiveDate(e.target.value)}
            fullWidth
            helperText="Leave empty to use current date and time"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={handleClose}
          disabled={archiveBusy}
        >
          Cancel
        </Button>
        <LoadingButton
          onClick={handleArchive}
          loading={archiveBusy}
          variant="contained"
          color="primary"
        >
          Archive Evaluation
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}

export default ArchiveEvaluationDialog 