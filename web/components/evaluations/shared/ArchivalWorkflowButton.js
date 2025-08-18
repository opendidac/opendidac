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
import { addWeeks, addMonths } from 'date-fns'

// Exclude from Archival Form Component
const ExcludeFromArchivalForm = ({ 
  evaluation, 
  onSuccess, 
  onCancel 
}) => {
  const { show: showSnackbar } = useSnackbar()
  const [busy, setBusy] = useState(false)
  const [comment, setComment] = useState('')

  // Common exclusion reasons
  const commonReasons = [
    'Test evaluation - no real student data',
    'Staff training exercise',
    'Demo or showcase evaluation',
    'Pilot or trial run',
    'Technical testing purposes',
    'Custom reason...'
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
            Accept: 'application/json' 
          },
          body: JSON.stringify({ 
            comment: comment.trim(),
          }),
        },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Failed to exclude evaluation from archival')
      
      showSnackbar('Evaluation excluded from archival', 'success')
      onSuccess?.()
    } catch (err) {
      showSnackbar(err.message || 'Failed to exclude evaluation from archival', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box sx={{ p: 2, minWidth: 400 }}>
      <Stack spacing={2}>
        <Typography variant="subtitle2" color="info">
          Exclude from Archival
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          Mark this evaluation as excluded from the archival process. Provide a reason below:
        </Typography>

        <Stack spacing={1}>
          <Typography variant="body2" fontWeight="medium">
            Common reasons:
          </Typography>
          <Stack spacing={1}>
            {commonReasons.map((reason) => (
              <Button
                key={reason}
                variant={comment === reason ? "contained" : "outlined"}
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

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button 
            size="small"
            onClick={onCancel}
            disabled={busy}
          >
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
    </Box>
  )
}

// Archive Immediately Form Component
const ArchiveImmediatelyForm = ({ 
  evaluation, 
  onSuccess, 
  onCancel 
}) => {
  const { show: showSnackbar } = useSnackbar()
  const [busy, setBusy] = useState(false)
  const [purgeDeadline, setPurgeDeadline] = useState(null)
  const [deadlineOption, setDeadlineOption] = useState('3months')

  // Preset deadline options for purge
  const presetOptions = [
    { value: '6months', label: '6 Months from now', date: addMonths(new Date(), 6) },
    { value: '1year', label: '1 Year from now', date: addMonths(new Date(), 12) },
    { value: '2years', label: '2 Years from now', date: addMonths(new Date(), 24) },
    { value: 'custom', label: 'Custom date', date: null },
  ]

  // Initialize with first preset option
  useEffect(() => {
    const firstPreset = presetOptions.find(p => p.value === '6months')
    if (firstPreset?.date) {
      setPurgeDeadline(firstPreset.date)
    }
  }, [])

  const handleDeadlineOptionChange = (event) => {
    const option = event.target.value
    setDeadlineOption(option)
    
    const preset = presetOptions.find(p => p.value === option)
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
            Accept: 'application/json' 
          },
          body: JSON.stringify({ 
            purgeDeadline: purgeDeadline?.toISOString() || null,
          }),
        },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Failed to archive evaluation')
      
      showSnackbar('Evaluation archived successfully', 'success')
      onSuccess?.()
    } catch (err) {
      showSnackbar(err.message || 'Failed to archive evaluation', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box sx={{ p: 2, minWidth: 400 }}>
      <Stack spacing={2}>
        <Typography variant="subtitle2" color="success">
          Archive Immediately
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          This will immediately archive the evaluation. Optionally set a purge deadline:
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
                <Stack>
                  <Typography variant="body2">
                    {option.label}
                  </Typography>
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
              value={purgeDeadline ? purgeDeadline.toISOString().split('T')[0] : ''}
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
                min: new Date().toISOString().split('T')[0]
              }}
            />
          </Box>
        )}

        <Divider />

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button 
            size="small"
            onClick={onCancel}
            disabled={busy}
          >
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
    </Box>
  )
}

// Mark for Archival Form Component
const MarkForArchivalForm = ({ 
  evaluation, 
  onSuccess, 
  onCancel 
}) => {
  const { show: showSnackbar } = useSnackbar()
  const [busy, setBusy] = useState(false)
  const [archivalDeadline, setArchivalDeadline] = useState(null)
  const [deadlineOption, setDeadlineOption] = useState('1week')
  const [notifyOwner, setNotifyOwner] = useState(true)

  // Preset deadline options
  const presetOptions = [
    { value: '2weeks', label: '2 Weeks from now', date: addWeeks(new Date(), 2) },
    { value: '1month', label: '1 Month from now', date: addMonths(new Date(), 1) },
    { value: '3months', label: '3 Months from now', date: addMonths(new Date(), 3) },
    { value: 'custom', label: 'Custom date', date: null },
  ]

  // Initialize with first preset option
  useEffect(() => {
    const firstPreset = presetOptions.find(p => p.value === '1week')
    if (firstPreset?.date) {
      setArchivalDeadline(firstPreset.date)
    }
  }, [])

  const handleDeadlineOptionChange = (event) => {
    const option = event.target.value
    setDeadlineOption(option)
    
    const preset = presetOptions.find(p => p.value === option)
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
            Accept: 'application/json' 
          },
          body: JSON.stringify({ 
            archivalDeadline: archivalDeadline?.toISOString() || null,
            notifyOwner,
          }),
        },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Failed to mark for archival')
      
      showSnackbar('Evaluation marked for archival', 'success')
      onSuccess?.()
    } catch (err) {
      showSnackbar(err.message || 'Failed to mark for archival', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box sx={{ p: 2, minWidth: 400 }}>
      <Stack spacing={2}>
        <Typography variant="subtitle2" color="primary">
          Mark for Archival
        </Typography>
        
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
              control={<Radio />}
              label={
                <Stack>
                  <Typography variant="body2">
                    {option.label}
                  </Typography>
                  {option.date && (
                    <Typography variant="caption" color="text.secondary">
                      {option.date.toLocaleDateString()} at {option.date.toLocaleTimeString()}
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
              label="Custom Archival Date"
              type="date"
              value={archivalDeadline ? archivalDeadline.toISOString().split('T')[0] : ''}
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
                min: new Date().toISOString().split('T')[0]
              }}
            />
          </Box>
        )}

        <Divider />

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button 
            size="small"
            onClick={onCancel}
            disabled={busy}
          >
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
      </Stack>
    </Box>
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
  const [showArchiveImmediatelyForm, setShowArchiveImmediatelyForm] = useState(false)
  const [showExcludeFromArchivalForm, setShowExcludeFromArchivalForm] = useState(false)
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
            label: 'Cancel Archival',
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
            label: 'Cancel Archival',
            description: 'Return to active state',
          },
        ]
      case 'EXCLUDED_FROM_ARCHIVAL':
        return [
          { 
            phase: 'ACTIVE', 
            label: 'Return to Active',
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
      await handleCancelArchival()
      return
    }
    
    handleClose()
    onTransition?.(evaluation, currentPhase, targetPhase)
  }

    const handleCancelArchival = async () => {
    try {
      const res = await fetch(
        `/api/admin/archive/${evaluation.id}/cancel-archival`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Accept: 'application/json' 
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

  // If no transitions available (PURGED), show as chip
  if (transitions.length === 0) {
    return (
      <Chip
        label={currentConfig.label}
        color={currentConfig.color}
        size={size}
        icon={<CurrentIcon />}
        variant="filled"
      />
    )
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

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: { 
            minWidth: (showMarkForArchivalForm || showArchiveImmediatelyForm || showExcludeFromArchivalForm) ? 450 : 280,
            maxWidth: (showMarkForArchivalForm || showArchiveImmediatelyForm || showExcludeFromArchivalForm) ? 500 : 320,
          }
        }}
      >
        {/* Current State */}
        <MenuItem>
          <ListItemIcon>
            <CurrentIcon color={currentConfig.color} />
          </ListItemIcon>
          <ListItemText>
            <Stack>
              <Typography variant="body2" fontWeight="medium">
                Data Cycle: {currentConfig.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Evaluation: {evaluation.label}
              </Typography>
              {/* Display phase-specific data */}
              {currentPhase === 'MARKED_FOR_ARCHIVAL' && evaluation.archivalDeadline && (
                <Typography variant="caption" color="warning.main" fontWeight="medium">
                  Deadline: {new Date(evaluation.archivalDeadline).toLocaleDateString()}
                </Typography>
              )}
              {currentPhase === 'ARCHIVED' && evaluation.archivedAt && (
                <Typography variant="caption" color="success.main" fontWeight="medium">
                  Archived: {new Date(evaluation.archivedAt).toLocaleDateString()}
                  {evaluation.archivedBy?.name && ` by ${evaluation.archivedBy.name}`}
                </Typography>
              )}
              {currentPhase === 'ARCHIVED' && evaluation.purgeDeadline && (
                <Typography variant="caption" color="error.main" fontWeight="medium">
                  Purge deadline: {new Date(evaluation.purgeDeadline).toLocaleDateString()}
                </Typography>
              )}
              {currentPhase === 'PURGED' && evaluation.purgedAt && (
                <Typography variant="caption" color="error.main" fontWeight="medium">
                  Purged: {new Date(evaluation.purgedAt).toLocaleDateString()}
                  {evaluation.purgedBy?.name && ` by ${evaluation.purgedBy.name}`}
                </Typography>
              )}
              {currentPhase === 'EXCLUDED_FROM_ARCHIVAL' && evaluation.excludedFromArchivalComment && (
                <Typography variant="caption" color="info.main" fontWeight="medium">
                  Reason: {evaluation.excludedFromArchivalComment}
                </Typography>
              )}
            </Stack>
          </ListItemText>
        </MenuItem>
        
        <Divider />

        {/* Available Transitions */}
        <MenuItem disabled>
          <Typography variant="caption" color="text.secondary" fontWeight="medium">
            Available Actions:
          </Typography>
        </MenuItem>

        {/* Show forms */}
        {showMarkForArchivalForm ? (
          <MarkForArchivalForm
            evaluation={evaluation}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        ) : showArchiveImmediatelyForm ? (
          <ArchiveImmediatelyForm
            evaluation={evaluation}
            onSuccess={handleArchiveImmediatelySuccess}
            onCancel={handleArchiveImmediatelyCancel}
          />
        ) : showExcludeFromArchivalForm ? (
          <ExcludeFromArchivalForm
            evaluation={evaluation}
            onSuccess={handleExcludeFromArchivalSuccess}
            onCancel={handleExcludeFromArchivalCancel}
          />
        ) : (
          // Show regular transition options
          transitions.map((transition) => {
            const TransitionIcon = phaseConfig[transition.phase]?.icon || RadioButtonUnchecked
            return (
              <MenuItem 
                key={transition.phase}
                onClick={() => handleTransition(transition.phase)}
              >
                <ListItemIcon>
                  <TransitionIcon color={phaseConfig[transition.phase]?.color} />
                </ListItemIcon>
                <ListItemText>
                  <Stack>
                    <Typography variant="body2">
                      {transition.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {transition.description}
                    </Typography>
                  </Stack>
                </ListItemText>
              </MenuItem>
            )
          })
        )}
      </Menu>
    </>
  )
}

export default ArchivalWorkflowButton 