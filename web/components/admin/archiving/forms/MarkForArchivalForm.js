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

import { useState, useEffect, useMemo } from 'react'
import {
  Button,
  Stack,
  Typography,
  Divider,
  FormControlLabel,
  RadioGroup,
  Radio,
  Box,
  TextField,
} from '@mui/material'
import { Schedule } from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import { useSnackbar } from '@/context/SnackbarContext'
import { addWeeks, addMonths } from 'date-fns'

const MarkForArchivalForm = ({ evaluation, onSuccess, onCancel }) => {
  const { show: showSnackbar } = useSnackbar()
  const [busy, setBusy] = useState(false)
  const [archivalDeadline, setArchivalDeadline] = useState(null)
  const [deadlineOption, setDeadlineOption] = useState('2weeks')

  // Preset deadline options, use Memo
  const presetOptions = useMemo(
    () => [
      { value: '2weeks', label: '2 Weeks', date: addWeeks(new Date(), 2) },
      { value: '1month', label: '1 Month', date: addMonths(new Date(), 1) },
      { value: '3months', label: '3 Months', date: addMonths(new Date(), 3) },
      { value: 'custom', label: 'Custom date', date: null },
    ],
    [],
  )

  // Initialize with first preset option
  useEffect(() => {
    const firstPreset = presetOptions.find((p) => p.value === '2weeks')
    if (firstPreset?.date) {
      setArchivalDeadline(firstPreset.date)
    }
  }, [presetOptions])

  const handleDeadlineOptionChange = (event) => {
    const option = event.target.value
    setDeadlineOption(option)

    const preset = presetOptions.find((p) => p.value === option)
    if (preset && preset.date) {
      setArchivalDeadline(preset.date)
    } else {
      setArchivalDeadline(null)
    }
  }

  const handleSubmit = async () => {
    setBusy(true)
    try {
      const res = await fetch(
        `/api/admin/archive/${evaluation.id}/mark-for-archival`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            archivalDeadline: archivalDeadline?.toISOString() || null,
          }),
        },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok)
        throw new Error(data?.message || 'Failed to mark for archival')

      showSnackbar('Evaluation marked for archival', 'success')
      onSuccess?.()
    } catch (err) {
      showSnackbar(err.message || 'Failed to mark for archival', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Typography variant="subtitle2">Mark for Archival</Typography>

      <Typography variant="body2" color="text.secondary">
        Choose when this evaluation should be archived:
      </Typography>

      <RadioGroup
        value={deadlineOption}
        onChange={handleDeadlineOptionChange}
        size="small"
      >
        {presetOptions.map((option) => (
          <FormControlLabel
            key={option.value}
            value={option.value}
            control={<Radio size="small" />}
            label={
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="body2">{option.label}</Typography>
                <Typography variant="body1">
                  {option.date && option.date.toLocaleDateString()}
                </Typography>
              </Stack>
            }
          />
        ))}
      </RadioGroup>

      {deadlineOption === 'custom' && (
        <Box>
          <TextField
            label="Custom Archival Date"
            type="date"
            value={
              archivalDeadline
                ? archivalDeadline.toISOString().split('T')[0]
                : ''
            }
            onChange={(e) => {
              const date = e.target.value ? new Date(e.target.value) : null
              setArchivalDeadline(date)
            }}
            size="small"
            fullWidth
            helperText="Set specific date for archival"
            InputLabelProps={{
              shrink: true,
            }}
            inputProps={{
              min: new Date().toISOString().split('T')[0],
            }}
          />
        </Box>
      )}

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
          color="warning"
          startIcon={<Schedule />}
          disabled={deadlineOption === 'custom' && !archivalDeadline}
        >
          Mark for Archival
        </LoadingButton>
      </Stack>
    </>
  )
}

export default MarkForArchivalForm
