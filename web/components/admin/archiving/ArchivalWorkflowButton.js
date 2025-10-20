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

// MUI Components
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  Divider,
  Box,
} from '@mui/material'

// MUI Icons
import { ArrowDropDown } from '@mui/icons-material'

// Third-party imports
import { format } from 'date-fns'

// Local imports
import DateTimeAgo from '@/components/feedback/DateTimeAgo'
import ArchiveImmediatelyForm from './forms/ArchiveImmediatelyForm'
import MarkForArchivalForm from './forms/MarkForArchivalForm'
import PurgeConfirmationForm from './forms/PurgeConfirmationForm'
import { getArchivalPhaseConfig } from './archivalPhaseConfig'

// Helper function to format date
const formatDate = (date) => {
  if (!date) return null
  return format(new Date(date), 'MMM dd, yyyy HH:mm')
}

// Evaluation Details Component
const EvaluationDetails = ({ evaluation, currentConfig }) => {
  return (
    <Box p={1}>
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <Box sx={{ mt: 0.5 }}>
          <currentConfig.icon color={currentConfig.color} />
        </Box>
        <Stack spacing={0.5} flex={1}>
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
      </Stack>
    </Box>
  )
}

// Archival Phase Details Component
const ArchivalPhaseDetails = ({ evaluation, currentPhase }) => {
  // Only show if there's archival-specific information
  const hasArchivalInfo =
    (currentPhase === 'MARKED_FOR_ARCHIVAL' && evaluation.archivalDeadline) ||
    (currentPhase === 'ARCHIVED' && evaluation.archivedAt) ||
    (currentPhase === 'PURGED' && evaluation.purgedAt) ||
    (currentPhase === 'PURGED_WITHOUT_ARCHIVAL' && evaluation.purgedAt)

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

        {currentPhase === 'PURGED_WITHOUT_ARCHIVAL' && evaluation.purgedAt && (
          <Typography variant="caption" color="error.main" fontWeight="medium">
            Purged without archival: {formatDate(evaluation.purgedAt)} (
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

const ArchivalWorkflowButton = ({
  evaluation,
  onTransition,
  size = 'small',
}) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const [showMarkForArchivalForm, setShowMarkForArchivalForm] = useState(false)
  const [showArchiveImmediatelyForm, setShowArchiveImmediatelyForm] =
    useState(false)
  const [showPurgeForm, setShowPurgeForm] = useState(false)
  const [purgeType, setPurgeType] = useState(null)
  const open = Boolean(anchorEl)

  // Determine current archival phase - use archivalPhase field primarily
  const getCurrentPhase = () => {
    // Use the archivalPhase field as the source of truth
    return evaluation.archivalPhase || 'ACTIVE'
  }

  const currentPhase = getCurrentPhase()

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
            phase: 'PURGED_WITHOUT_ARCHIVAL',
            label: 'Purge Without Archive',
            description:
              'Permanently delete student data without archiving first',
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
            description: 'Permanently delete student data (after archival)',
          },
          {
            phase: 'ACTIVE',
            label: 'Back to Active',
            description: 'Return to active state',
          },
        ]
      case 'PURGED':
        return []
      default:
        return []
    }
  }

  const currentConfig = getArchivalPhaseConfig(currentPhase)
  const CurrentIcon = currentConfig.icon
  const transitions = getAvailableTransitions(currentPhase)

  const handleClick = (event) => {
    // Always allow clicking to show current state details, even if no transitions available
    // This is especially important for purged states to show who purged and when
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
    setShowMarkForArchivalForm(false)
    setShowArchiveImmediatelyForm(false)
    setShowPurgeForm(false)
    setPurgeType(null)
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

    if (targetPhase === 'PURGED_WITHOUT_ARCHIVAL') {
      setPurgeType('PURGED_WITHOUT_ARCHIVAL')
      setShowPurgeForm(true)
      return
    }

    if (targetPhase === 'PURGED') {
      setPurgeType('PURGED')
      setShowPurgeForm(true)
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

      handleClose()
      onTransition?.(evaluation, currentPhase, 'ACTIVE')
    } catch (err) {
      console.error('Error cancelling archival:', err)
      // Note: showSnackbar was removed, errors are logged to console
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

  const handlePurgeSuccess = () => {
    handleClose()
    onTransition?.(evaluation, currentPhase, purgeType)
  }

  const handlePurgeCancel = () => {
    setShowPurgeForm(false)
    setPurgeType(null)
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

          {showPurgeForm && (
            <Stack p={2}>
              <PurgeConfirmationForm
                evaluation={evaluation}
                purgeType={purgeType}
                onSuccess={handlePurgeSuccess}
                onCancel={handlePurgeCancel}
              />
            </Stack>
          )}

          {/* Transition Actions Section */}
          {(() => {
            const isShowingForm =
              showMarkForArchivalForm ||
              showArchiveImmediatelyForm ||
              showPurgeForm
            return (
              !isShowingForm && (
                <>
                  {transitions.length > 0 ? (
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
                        const transitionConfig = getArchivalPhaseConfig(
                          transition.phase,
                        )
                        const TransitionIcon = transitionConfig.icon
                        return (
                          <MenuItem
                            key={transition.phase}
                            onClick={() => handleTransition(transition.phase)}
                          >
                            <ListItemIcon>
                              <TransitionIcon color={transitionConfig.color} />
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
                  ) : (
                    <MenuItem>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontStyle="italic"
                      >
                        No actions available
                      </Typography>
                    </MenuItem>
                  )}
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
