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
  Button,
  Stack,
  Typography,
  Divider,
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import { DeleteForever } from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import { useSnackbar } from '@/context/SnackbarContext'

const PurgeConfirmationForm = ({
  evaluation,
  purgeType,
  onSuccess,
  onCancel,
}) => {
  const { show: showSnackbar } = useSnackbar()
  const [busy, setBusy] = useState(false)
  const [acknowledgeDataLoss, setAcknowledgeDataLoss] = useState(false)

  const isDirectPurge = purgeType === 'PURGED_WITHOUT_ARCHIVAL'

  const handleSubmit = async () => {
    if (!acknowledgeDataLoss) {
      showSnackbar('Please acknowledge data loss', 'error')
      return
    }

    setBusy(true)
    try {
      const endpoint = isDirectPurge
        ? `/api/admin/archive/${evaluation.id}/purge-without-archive`
        : `/api/admin/archive/${evaluation.id}/purge-data`

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok)
        throw new Error(data?.message || 'Failed to purge evaluation')

      showSnackbar(
        `Evaluation ${isDirectPurge ? 'purged without archival' : 'data purged'} successfully`,
        'success',
      )
      onSuccess?.()
    } catch (err) {
      showSnackbar(err.message || 'Failed to purge evaluation', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Stack spacing={3}>
        <Typography variant="h6" color="error" fontWeight="bold">
          ⚠️ DANGER: Permanent Data Loss
        </Typography>

        <Typography variant="subtitle1" color="error" fontWeight="medium">
          {isDirectPurge ? 'Purge Without Archival' : 'Purge Student Data'}
        </Typography>

        <Stack spacing={1}>
          <Typography variant="body1" color="text.primary" fontWeight="medium">
            This action will permanently delete:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • All student answers and submissions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Student grading results and feedback
          </Typography>
        </Stack>

        <Stack spacing={1}>
          <Typography variant="body1" color="text.primary" fontWeight="medium">
            The data that will be preserved:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            - Student participation records
          </Typography>
          <Typography variant="body2" color="text.secondary">
            - Evaluation settings and metadata
          </Typography>
          <Typography variant="body2" color="text.secondary">
            - Evaluation composition
          </Typography>
        </Stack>

        <FormControlLabel
          control={
            <Checkbox
              checked={acknowledgeDataLoss}
              onChange={(e) => setAcknowledgeDataLoss(e.target.checked)}
              color="error"
            />
          }
          label={
            <Typography variant="body2" color="error">
              I understand that this action is irreversible
            </Typography>
          }
        />

        <Divider />

        <Stack direction="row" spacing={1} justifyContent="flex-end" py={2}>
          <Button size="small" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <LoadingButton
            size="small"
            onClick={handleSubmit}
            loading={busy}
            variant="contained"
            color="error"
            startIcon={<DeleteForever />}
            disabled={!acknowledgeDataLoss}
          >
            {isDirectPurge ? 'Purge Without Archive' : 'Purge Data'}
          </LoadingButton>
        </Stack>
      </Stack>
    </>
  )
}

export default PurgeConfirmationForm
