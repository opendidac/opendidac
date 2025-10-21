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
import { Button, Stack, Typography, Divider } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useSnackbar } from '@/context/SnackbarContext'
import Image from 'next/image'
import { Archive } from '@mui/icons-material'

const ArchiveImmediatelyForm = ({ evaluation, onSuccess, onCancel }) => {
  const { show: showSnackbar } = useSnackbar()
  const [busy, setBusy] = useState(false)

  const handleSubmit = async () => {
    setBusy(true)
    try {
      const res = await fetch(
        `/api/admin/archive/${evaluation.id}/archive-immediately`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok)
        throw new Error(data?.message || 'Failed to archive evaluation')

      showSnackbar('Evaluation archived successfully', 'success')
      onSuccess?.()
    } catch (err) {
      showSnackbar(err.message || 'Failed to archive evaluation', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Stack spacing={2}>
        <Typography variant="subtitle2" color="success">
          Archive Immediately
        </Typography>

        <Typography variant="body2" color="text.secondary">
          This will immediately set the evaluation to archived.
        </Typography>

        <Typography variant="body2" color="text.secondary">
          At this point, the evaluation data should already be handed over to
          the archive team.
        </Typography>

        <Typography variant="body2" color="text.secondary">
          The evaluation will be archived immediately and the data will be
          handed over to the archive team.
        </Typography>

        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            window.open(
              `/api/${evaluation.groupScope}/evaluations/${evaluation.id}/export`,
              '_blank',
            )
          }}
          startIcon={
            <Image
              alt="Export"
              src="/svg/icons/file-pdf.svg"
              width="16"
              height="16"
            />
          }
        >
          PDF
        </Button>

        <Divider />

        <Stack direction="row" spacing={1} justifyContent="flex-end" py={2}>
          <Button size="small" onClick={onCancel} disabled={busy}>
            Back
          </Button>
          <LoadingButton
            size="small"
            onClick={handleSubmit}
            loading={busy}
            variant="contained"
            color="success"
            startIcon={<Archive />}
          >
            Set as Archived now
          </LoadingButton>
        </Stack>
      </Stack>
    </>
  )
}

export default ArchiveImmediatelyForm
