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
import { useState, useEffect } from 'react'
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Stack,
  Typography,
  Divider,
  TextField,
  FormControlLabel,
  RadioGroup,
  Radio,
  Box,
  Checkbox,
} from '@mui/material'
import {
  ArrowDropDown,
  RadioButtonUnchecked,
  Schedule,
  Archive,
  DeleteForever,
} from '@mui/icons-material'
// Removed MUI X Date Pickers due to compatibility issues
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
// import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LoadingButton } from '@mui/lab'
import { useSnackbar } from '@/context/SnackbarContext'
import { addWeeks, addMonths, format } from 'date-fns'
import DateTimeAgo from '@/components/feedback/DateTimeAgo'

// Helper function to format duration
const formatDuration = (hours, mins) => {
  if (!hours && !mins) return null
  if (hours && mins) return `${hours}h ${mins}m`
  if (hours) return `${hours}h`
  if (mins) return `${mins}m`
  return null
}

// Helper function to format date
const formatDate = (date) => {
  if (!date) return null
  return format(new Date(date), 'MMM dd, yyyy HH:mm')
}

// Evaluation Details Component
const EvaluationDetails = ({ evaluation, currentPhase, currentConfig }) => {
  const duration = formatDuration(
    evaluation.durationHours,
    evaluation.durationMins,
  )

  return (
    <MenuItem>
      <ListItemIcon>
        <currentConfig.icon color={currentConfig.color} />
      </ListItemIcon>
      <ListItemText>
        <Stack spacing={0.5}>
          {/* Main title */}
          <Typography variant="body2" fontWeight="medium">
            Data Cycle: {currentConfig.label}
          </Typography>

          {/* Evaluation basic info */}
          <Typography variant="caption" color="text.secondary">
            Evaluation: {evaluation.label}
          </Typography>

          {/* Timing information */}
          {(evaluation.startAt || evaluation.endAt) && (
            <Stack spacing={0.25}>
              {evaluation.startAt && (
                <Typography variant="caption" color="text.secondary">
                  Started: {formatDate(evaluation.startAt)} (
                  <DateTimeAgo date={new Date(evaluation.startAt)} />)
                </Typography>
              )}
              {evaluation.endAt && (
                <Typography variant="caption" color="text.secondary">
                  Ended: {formatDate(evaluation.endAt)} (
                  <DateTimeAgo date={new Date(evaluation.endAt)} />)
                </Typography>
              )}
            </Stack>
          )}
        </Stack>
      </ListItemText>
    </MenuItem>
  )
}

// Archival Phase Details Component
const ArchivalPhaseDetails = ({ evaluation, currentPhase }) => {
  // Only show if there's archival-specific information
  const hasArchivalInfo =
    (currentPhase === 'MARKED_FOR_ARCHIVAL' && evaluation.archivalDeadline) ||
    (currentPhase === 'ARCHIVED' &&
      (evaluation.archivedAt || evaluation.purgeDeadline)) ||
    (currentPhase === 'EXCLUDED_FROM_ARCHIVAL' &&
      (evaluation.excludedFromArchivalAt ||
        evaluation.excludedFromArchivalComment)) ||
    (currentPhase === 'PURGED' && evaluation.purgedAt)

  if (!hasArchivalInfo) return null

  return (
    <Box sx={{ px: 2, py: 1 }}>
      <Stack spacing={0.5}>
        <Typography variant="caption" color="text.primary" fontWeight="medium">
          Archival Status
        </Typography>

        {/* Phase-specific archival data */}
        {currentPhase === 'MARKED_FOR_ARCHIVAL' &&
          evaluation.archivalDeadline && (
            <Typography
              variant="caption"
              color="warning.main"
              fontWeight="medium"
            >
              Deadline: {formatDate(evaluation.archivalDeadline)} (
              <DateTimeAgo date={new Date(evaluation.archivalDeadline)} />)
            </Typography>
          )}

        {currentPhase === 'ARCHIVED' && (
          <Stack spacing={0.25}>
            {evaluation.archivedAt && (
              <Typography
                variant="caption"
                color="success.main"
                fontWeight="medium"
              >
                Archived: {formatDate(evaluation.archivedAt)} (
                <DateTimeAgo date={new Date(evaluation.archivedAt)} />)
                {evaluation.archivedBy?.name && (
                  <>
                    <br />
                    by {evaluation.archivedBy.name}
                  </>
                )}
              </Typography>
            )}
            {evaluation.purgeDeadline && (
              <Typography
                variant="caption"
                color="error.main"
                fontWeight="medium"
              >
                Purge Deadline: {formatDate(evaluation.purgeDeadline)} (
                <DateTimeAgo date={new Date(evaluation.purgeDeadline)} />)
              </Typography>
            )}
          </Stack>
        )}

        {currentPhase === 'EXCLUDED_FROM_ARCHIVAL' && (
          <Stack spacing={0.25}>
            {evaluation.excludedFromArchivalAt && (
              <Typography
                variant="caption"
                color="info.main"
                fontWeight="medium"
              >
                Excluded: {formatDate(evaluation.excludedFromArchivalAt)} (
                <DateTimeAgo
                  date={new Date(evaluation.excludedFromArchivalAt)}
                />
                )
                {evaluation.excludedFromArchivalBy?.name && (
                  <>
                    <br />
                    by {evaluation.excludedFromArchivalBy.name}
                  </>
                )}
              </Typography>
            )}
            {evaluation.excludedFromArchivalComment && (
              <Typography
                variant="caption"
                color="info.main"
                fontWeight="medium"
              >
                Reason: {evaluation.excludedFromArchivalComment}
              </Typography>
            )}
          </Stack>
        )}

        {currentPhase === 'PURGED' && evaluation.purgedAt && (
          <Typography variant="caption" color="error.main" fontWeight="medium">
            Purged: {formatDate(evaluation.purgedAt)} (
            <DateTimeAgo date={new Date(evaluation.purgedAt)} />)
            {evaluation.purgedBy?.name && (
              <>
                <br />
                by {evaluation.purgedBy.name}
              </>
            )}
          </Typography>
        )}
      </Stack>
    </Box>
  )
}

// Exclude from Archival Form Component
const ExcludeFromArchivalForm = ({ evaluation, onSuccess, onCancel }) => {
  const { show: showSnackbar } = useSnackbar()
  const [busy, setBusy] = useState(false)
  const [comment, setComment] = useState('')

  // Common exclusion reasons
  const commonReasons = [
    'Test evaluation',
    'Staff training evaluation',
    'Demo or showcase evaluation',
    'Technical testing purposes',
    'Custom reason...',
  ]

  const handleReasonSelect = (reason) => {
    if (reason === 'Custom reason...') {
      setComment('')
    } else {
      setComment(reason)
    }
  }

  const handleSubmit = async () => {
    if (!comment.trim()) {
      showSnackbar('Please provide a reason for exclusion', 'error')
      return
    }

    setBusy(true)
    try {
      const res = await fetch(
        `/api/admin/archive/${evaluation.id}/exclude-from-archival`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            comment: comment.trim(),
          }),
        },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok)
        throw new Error(
          data?.message || 'Failed to exclude evaluation from archival',
        )

      showSnackbar('Evaluation excluded from archival', 'success')
      onSuccess?.()
    } catch (err) {
      showSnackbar(
        err.message || 'Failed to exclude evaluation from archival',
        'error',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Stack spacing={2}>
        <Typography variant="subtitle2" color="info">
          Exclude from Archival
        </Typography>

        <Typography variant="body2" color="text.secondary">
          The evaluation can be excluded only in case it does not contain any real student data.
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Provide a reason below:
        </Typography>

        <Stack spacing={1}>
          <Typography variant="body2" fontWeight="medium">
            Common reasons:
          </Typography>
          <Stack spacing={1}>
            {commonReasons.map((reason) => (
              <Button
                key={reason}
                variant={comment === reason ? 'contained' : 'outlined'}
                color="info"
                size="small"
                onClick={() => handleReasonSelect(reason)}
                sx={{ justifyContent: 'flex-start' }}
              >
                {reason}
              </Button>
            ))}
          </Stack>
        </Stack>

        <TextField
          label="Exclusion Reason"
          multiline
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Explain why this evaluation should be excluded from archival..."
          helperText={`${comment.length}/500 characters`}
          inputProps={{ maxLength: 500 }}
          size="small"
          fullWidth
          required
        />

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
            color="info"
            startIcon={<RadioButtonUnchecked />}
            disabled={!comment.trim()}
          >
            Exclude from Archival
          </LoadingButton>
        </Stack>
      </Stack>
    </>
  )
}

// Archive Immediately Form Component
const ArchiveImmediatelyForm = ({ evaluation, onSuccess, onCancel }) => {
  const { show: showSnackbar } = useSnackbar()
  const [busy, setBusy] = useState(false)
  const [purgeDeadline, setPurgeDeadline] = useState(null)
  const [deadlineOption, setDeadlineOption] = useState('3months')

  // Preset deadline options for purge
  const presetOptions = [
    {
      value: '1weeks',
      label: '1 Weeks',
      date: addWeeks(new Date(), 1)
    },
    {
      value: '3weeks',
      label: '3 Weeks',
      date: addWeeks(new Date(), 3)
    },
    {
      value: '1month',
      label: '1 Month',
      date: addMonths(new Date(), 1)
    },
    {
      value: '3months',
      label: '3 Months',
      date: addMonths(new Date(), 3)
    },
    { value: 'custom', label: 'Custom date', date: null },
  ]

  // Initialize with first preset option
  useEffect(() => {
    const firstPreset = presetOptions.find((p) => p.value === '6months')
    if (firstPreset?.date) {
      setPurgeDeadline(firstPreset.date)
    }
  }, [])

  const handleDeadlineOptionChange = (event) => {
    const option = event.target.value
    setDeadlineOption(option)

    const preset = presetOptions.find((p) => p.value === option)
    if (preset && preset.date) {
      setPurgeDeadline(preset.date)
    } else {
      setPurgeDeadline(null)
    }
  }

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
          body: JSON.stringify({
            purgeDeadline: purgeDeadline?.toISOString() || null,
          }),
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
          This will immediately archive the evaluation. Optionally set a purge
          deadline:
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
              control={<Radio />}
              label={
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                  <Typography variant="body2">{option.label}</Typography>
                  {option.date && (
                    <Typography variant="caption" color="text.secondary">
                      {option.date.toLocaleDateString()}
                    </Typography>
                  )}
                </Stack>
              }
            />
          ))}
        </RadioGroup>

        {deadlineOption === 'custom' && (
          <Box sx={{ ml: 4 }}>
            <TextField
              label="Custom Purge Date"
              type="date"
              value={
                purgeDeadline ? purgeDeadline.toISOString().split('T')[0] : ''
              }
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null
                setPurgeDeadline(date)
              }}
              size="small"
              fullWidth
              helperText="Set specific date for purging student data"
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
            color="success"
            startIcon={<Archive />}
            disabled={deadlineOption === 'custom' && !purgeDeadline}
          >
            Archive Now
          </LoadingButton>
        </Stack>
      </Stack>
    </>
  )
}

// Mark for Archival Form Component
const MarkForArchivalForm = ({ evaluation, onSuccess, onCancel }) => {
  const { show: showSnackbar } = useSnackbar()
  const [busy, setBusy] = useState(false)
  const [archivalDeadline, setArchivalDeadline] = useState(null)
  const [deadlineOption, setDeadlineOption] = useState('1week')
  const [notifyOwner, setNotifyOwner] = useState(true)

  // Preset deadline options
  const presetOptions = [
    { value: '2weeks', label: '2 Weeks', date: addWeeks(new Date(), 2) },
    { value: '1month', label: '1 Month', date: addMonths(new Date(), 1) },
    { value: '3months', label: '3 Months', date: addMonths(new Date(), 3) },
    { value: 'custom', label: 'Custom date', date: null },
  ]

  // Initialize with first preset option
  useEffect(() => {
    const firstPreset = presetOptions.find((p) => p.value === '1week')
    if (firstPreset?.date) {
      setArchivalDeadline(firstPreset.date)
    }
  }, [])

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
            notifyOwner,
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

const ArchivalWorkflowButton = ({
  evaluation,
  onTransition,
  size = 'small',
}) => {
  const { show: showSnackbar } = useSnackbar()
  const [anchorEl, setAnchorEl] = useState(null)
  const [showMarkForArchivalForm, setShowMarkForArchivalForm] = useState(false)
  const [showArchiveImmediatelyForm, setShowArchiveImmediatelyForm] =
    useState(false)
  const [showExcludeFromArchivalForm, setShowExcludeFromArchivalForm] =
    useState(false)
  const open = Boolean(anchorEl)

  // Determine current archival phase - use archivalPhase field primarily
  const getCurrentPhase = () => {
    // Use the archivalPhase field as the source of truth
    return evaluation.archivalPhase || 'ACTIVE'
  }

  const currentPhase = getCurrentPhase()

  // Define phases and their display properties
  const phaseConfig = {
    ACTIVE: {
      label: 'Active',
      color: 'primary',
      icon: RadioButtonUnchecked,
    },
    EXCLUDED_FROM_ARCHIVAL: {
      label: 'Excluded',
      color: 'info',
      icon: RadioButtonUnchecked,
    },
    MARKED_FOR_ARCHIVAL: {
      label: 'Marked for Archive',
      color: 'warning',
      icon: Schedule,
    },
    ARCHIVED: {
      label: 'Archived',
      color: 'success',
      icon: Archive,
    },
    PURGED: {
      label: 'Purged',
      color: 'error',
      icon: DeleteForever,
    },
  }

  // Define available transitions for each phase
  const getAvailableTransitions = (phase) => {
    switch (phase) {
      case 'ACTIVE':
        return [
          {
            phase: 'MARKED_FOR_ARCHIVAL',
            label: 'Mark for Archival',
            description: 'Set archival deadline or mark immediately',
          },
          {
            phase: 'ARCHIVED',
            label: 'Archive Immediately',
            description: 'Archive without marking first',
          },
          {
            phase: 'EXCLUDED_FROM_ARCHIVAL',
            label: 'Exclude from Archival',
            description: 'Mark as not requiring archival (tests, demos, etc.)',
          },
        ]
      case 'MARKED_FOR_ARCHIVAL':
        return [
          {
            phase: 'ARCHIVED',
            label: 'Archive Now',
            description: 'Complete the archival process',
          },
          {
            phase: 'ACTIVE',
            label: 'Back to Active',
            description: 'Return to active state',
          },
        ]
      case 'ARCHIVED':
        return [
          {
            phase: 'PURGED',
            label: 'Purge Data',
            description: 'Permanently delete student data',
          },
          {
            phase: 'ACTIVE',
            label: 'Back to Active',
            description: 'Return to active state',
          },
        ]
      case 'EXCLUDED_FROM_ARCHIVAL':
        return [
          {
            phase: 'ACTIVE',
            label: 'Back to Active',
            description: 'Remove exclusion and return to active state',
          },
        ]
      case 'PURGED':
        return []
      default:
        return []
    }
  }

  const currentConfig = phaseConfig[currentPhase]
  const CurrentIcon = currentConfig?.icon || RadioButtonUnchecked
  const transitions = getAvailableTransitions(currentPhase)

  const handleClick = (event) => {
    if (transitions.length > 0) {
      setAnchorEl(event.currentTarget)
    }
  }

  const handleClose = () => {
    setAnchorEl(null)
    setShowMarkForArchivalForm(false)
    setShowArchiveImmediatelyForm(false)
    setShowExcludeFromArchivalForm(false)
  }

  const handleTransition = async (targetPhase) => {
    if (targetPhase === 'MARKED_FOR_ARCHIVAL') {
      setShowMarkForArchivalForm(true)
      return
    }

    if (targetPhase === 'ARCHIVED') {
      setShowArchiveImmediatelyForm(true)
      return
    }

    if (targetPhase === 'EXCLUDED_FROM_ARCHIVAL') {
      setShowExcludeFromArchivalForm(true)
      return
    }

    if (targetPhase === 'ACTIVE') {
      // Handle cancel archival (works for both MARKED_FOR_ARCHIVAL and ARCHIVED phases)
      await handleBackToActive()
      return
    }

    handleClose()
    onTransition?.(evaluation, currentPhase, targetPhase)
  }

  const handleBackToActive = async () => {
    try {
      const res = await fetch(
        `/api/admin/archive/${evaluation.id}/back-to-active`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Failed to cancel archival')

      showSnackbar('Archival cancelled successfully', 'success')
      handleClose()
      onTransition?.(evaluation, currentPhase, 'ACTIVE')
    } catch (err) {
      console.error('Error cancelling archival:', err)
      showSnackbar(err.message || 'Failed to cancel archival', 'error')
    }
  }

  const handleFormSuccess = () => {
    handleClose()
    onTransition?.(evaluation, currentPhase, 'MARKED_FOR_ARCHIVAL')
  }

  const handleFormCancel = () => {
    setShowMarkForArchivalForm(false)
  }

  const handleArchiveImmediatelySuccess = () => {
    handleClose()
    onTransition?.(evaluation, currentPhase, 'ARCHIVED')
  }

  const handleArchiveImmediatelyCancel = () => {
    setShowArchiveImmediatelyForm(false)
  }

  const handleExcludeFromArchivalSuccess = () => {
    handleClose()
    onTransition?.(evaluation, currentPhase, 'EXCLUDED_FROM_ARCHIVAL')
  }

  const handleExcludeFromArchivalCancel = () => {
    setShowExcludeFromArchivalForm(false)
  }

  return (
    <>
      <Button
        variant="outlined"
        size={size}
        color={currentConfig.color}
        startIcon={<CurrentIcon />}
        endIcon={<ArrowDropDown />}
        onClick={handleClick}
        sx={{ minWidth: 140 }}
      >
        {currentConfig.label}
      </Button>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {/* Current State */}
        <Stack direction="column" spacing={1} p={1}>
          <EvaluationDetails
            evaluation={evaluation}
            currentPhase={currentPhase}
            currentConfig={currentConfig}
          />

          <Divider />

          {/* Archival Phase Details */}
          <ArchivalPhaseDetails
            evaluation={evaluation}
            currentPhase={currentPhase}
          />

          
          {/* Available Transitions */}

          {/* Forms Section */}
          {showMarkForArchivalForm && (
            <Stack p={2}>
              <MarkForArchivalForm
                evaluation={evaluation}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </Stack>
          )}

          {showArchiveImmediatelyForm && (
            <Stack p={2}>
              <ArchiveImmediatelyForm
                evaluation={evaluation}
                onSuccess={handleArchiveImmediatelySuccess}
                onCancel={handleArchiveImmediatelyCancel}
              />
            </Stack>
          )}

          {showExcludeFromArchivalForm && (
            <Stack p={2}>
              <ExcludeFromArchivalForm
                evaluation={evaluation}
                onSuccess={handleExcludeFromArchivalSuccess}
                onCancel={handleExcludeFromArchivalCancel}
              />
            </Stack>
          )}

          {/* Transition Actions Section */}
          {(() => {
            const isShowingForm =
              showMarkForArchivalForm ||
              showArchiveImmediatelyForm ||
              showExcludeFromArchivalForm
            return (
              !isShowingForm && (
                <>
                  <MenuItem>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      fontWeight="medium"
                    >
                      Available Actions:
                    </Typography>
                  </MenuItem>
                  {transitions.map((transition) => {
                    const TransitionIcon =
                      phaseConfig[transition.phase]?.icon ||
                      RadioButtonUnchecked
                    return (
                      <MenuItem
                        key={transition.phase}
                        onClick={() => handleTransition(transition.phase)}
                      >
                        <ListItemIcon>
                          <TransitionIcon
                            color={phaseConfig[transition.phase]?.color}
                          />
                        </ListItemIcon>
                        <ListItemText>
                          <Stack>
                            <Typography variant="body2">
                              {transition.label}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {transition.description}
                            </Typography>
                          </Stack>
                        </ListItemText>
                      </MenuItem>
                    )
                  })}
                </>
              )
            )
          })()}
        </Stack>
      </Menu>
    </>
  )
}

export default ArchivalWorkflowButton
