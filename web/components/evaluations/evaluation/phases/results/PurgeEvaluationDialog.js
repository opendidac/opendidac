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
import { Stack, Typography } from '@mui/material'
import DangerConfirmDialog from '@/components/feedback/DangerConfirmDialog'
import AlertFeedback from '@/components/feedback/AlertFeedback'
import ExportPdfButton from '../evaluation/phases/results/ExportPdfButton'
import { useSnackbar } from '@/context/SnackbarContext'

const PurgeEvaluationDialog = ({
  open,
  onClose,
  evaluation,
  groupScope,
  onSuccess,
}) => {
  const { show: showSnackbar } = useSnackbar()
  const [purgeBusy, setPurgeBusy] = useState(false)
  const confirmText = `purge ${evaluation.id}`

  const purgeEvaluation = async () => {
    setPurgeBusy(true)
    try {
      const res = await fetch(
        `/api/${groupScope}/evaluations/${evaluation.id}/purge`,
        {
          method: 'POST',
          headers: { Accept: 'application/json' },
        },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Failed to purge')
      showSnackbar('Student data purged', 'success')
      onClose()
      onSuccess?.()
    } catch (err) {
      showSnackbar(err.message || 'Purge failed', 'error')
    } finally {
      setPurgeBusy(false)
    }
  }

  return (
    <DangerConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={purgeEvaluation}
      width="sm"
      title="Purge all student data for this evaluation?"
      confirmButtonProps={{
        children: purgeBusy ? 'Purging…' : 'Purge now',
        disabled: purgeBusy,
      }}
      content={
        <Stack spacing={1.5}>
          <AlertFeedback severity="warning">
            This will permanently delete all <b>student answers</b> and related
            feedback. It will keep the evaluation's <b>composition</b>{' '}
            (questions & points) and the attendance list.
          </AlertFeedback>
          <AlertFeedback severity="warning">
            This action is <b>irreversible</b>.
          </AlertFeedback>
          <AlertFeedback severity="info">
            Consider exporting the results for the archive before you proceed.
          </AlertFeedback>

          <ExportPdfButton
            groupScope={groupScope}
            evaluationId={evaluation.id}
            variant="outlined"
          />

          <Typography variant="body2">
            To confirm, type{' '}
            <b>
              <code>{confirmText}</code>
            </b>{' '}
            below.
          </Typography>
        </Stack>
      }
      prompt=""
      expectedValue={confirmText}
      helperText="Type the exact phrase to enable the button."
    />
  )
}

export default PurgeEvaluationDialog
