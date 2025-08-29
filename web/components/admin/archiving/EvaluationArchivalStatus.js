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
import { Menu, Stack, Typography, Box, Paper } from '@mui/material'

// MUI Icons
import { Info } from '@mui/icons-material'

// Third-party imports
import { format } from 'date-fns'
import { ArchivalPhase } from '@prisma/client'

// Local imports
import DateTimeAgo from '@/components/feedback/DateTimeAgo'
import UserAvatar from '@/components/layout/UserAvatar'
import {
  getCurrentArchivalPhase,
  getArchivalPhaseConfig,
} from './archivalPhaseConfig'

// Helper function to format date
const formatDate = (date) => {
  if (!date) return null
  return format(new Date(date), 'MMM dd, yyyy HH:mm')
}

// Archival Phase Details Component
const ArchivalPhaseDetails = ({ evaluation, currentPhase, currentConfig }) => {
  return (
    <Box px={2} py={1}>
      <Stack spacing={1.5}>
        {/* Main archival status */}
        <Stack direction="row" spacing={1} alignItems="center">
          <currentConfig.icon color={currentConfig.color} />
          <Typography
            variant="body2"
            fontWeight="medium"
            color={`${currentConfig.color}.main`}
          >
            {currentConfig.label}
          </Typography>
        </Stack>

        {/* Phase-specific archival data */}
        {currentPhase === ArchivalPhase.MARKED_FOR_ARCHIVAL &&
          evaluation.archivalDeadline && (
            <Box>
              <Typography variant="body2" color="text.primary" mb={1}>
                This evaluation is marked for archival and will be archived by{' '}
                <strong>{formatDate(evaluation.archivalDeadline)}</strong>.
              </Typography>
              <Typography
                variant="caption"
                color="warning.main"
                fontWeight="medium"
              >
                Scheduled for{' '}
                <DateTimeAgo date={new Date(evaluation.archivalDeadline)} />
              </Typography>
            </Box>
          )}

        {currentPhase === ArchivalPhase.ARCHIVED && evaluation.archivedAt && (
          <Stack spacing={1}>
            <Typography variant="body2" color="text.primary">
              This evaluation has been archived. The student data and feedbacks
              will soon be purged.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Archived on {formatDate(evaluation.archivedAt)} (
              <DateTimeAgo date={new Date(evaluation.archivedAt)} />)
            </Typography>
            {evaluation.archivedBy && (
              <Box>
                <Typography variant="caption" color="text.secondary" mb={0.5}>
                  Archived by:
                </Typography>
                <UserAvatar user={evaluation.archivedBy} collapsed={false} />
              </Box>
            )}
            <Typography
              variant="caption"
              color="text.secondary"
              fontStyle="italic"
            >
              The evaluation will be available for consultation until it is
              purged.
            </Typography>
          </Stack>
        )}

        {currentPhase === ArchivalPhase.PURGED && evaluation.purgedAt && (
          <Stack spacing={1}>
            <Typography variant="body2" color="text.primary">
              This evaluation&apos;s student data has been permanently removed
              from the system after being safely archived.
            </Typography>
            <Typography variant="body2" color="text.primary">
              Only the evaluation metadata, composition and attendance data
              remain accessible.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Data purged on {formatDate(evaluation.purgedAt)} (
              <DateTimeAgo date={new Date(evaluation.purgedAt)} />)
            </Typography>
            {evaluation.purgedBy && (
              <Box>
                <Typography variant="caption" color="text.secondary" mb={0.5}>
                  Purged by:
                </Typography>
                <UserAvatar user={evaluation.purgedBy} collapsed={false} />
              </Box>
            )}
            <Typography
              variant="caption"
              color="text.secondary"
              fontStyle="italic"
            >
              Student answers and personal data have been removed, but the
              archived copy is preserved.
            </Typography>
          </Stack>
        )}

        {currentPhase === ArchivalPhase.PURGED_WITHOUT_ARCHIVAL &&
          evaluation.purgedAt && (
            <Stack spacing={1}>
              <Typography variant="body2" color="text.primary">
                This evaluation&apos;s student data has been permanently removed
                from the system without being previously archived.
              </Typography>
              <Typography variant="body2" color="text.primary">
                Only the evaluation metadata, composition and attendance data
                remain accessible.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Data purged on {formatDate(evaluation.purgedAt)} (
                <DateTimeAgo date={new Date(evaluation.purgedAt)} />)
              </Typography>
              {evaluation.purgedBy && (
                <Box>
                  <Typography variant="caption" color="text.secondary" mb={0.5}>
                    Purged by:
                  </Typography>
                  <UserAvatar user={evaluation.purgedBy} collapsed={false} />
                </Box>
              )}
              <Typography
                variant="caption"
                color="error.main"
                fontStyle="italic"
              >
                Student answers and personal data have been permanently deleted
                without archival.
              </Typography>
            </Stack>
          )}

        {/* Information note */}
        <Stack direction="row" spacing={1} alignItems="center" mt={1}>
          <Info color="action" fontSize="small" />
          <Typography
            variant="caption"
            color="text.secondary"
            fontStyle="italic"
          >
            Data archival and retention policies are managed by administrators.
          </Typography>
        </Stack>
      </Stack>
    </Box>
  )
}

const EvaluationArchivalStatus = ({ evaluation, size = 'small' }) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  const currentPhase = getCurrentArchivalPhase(evaluation)

  // Only show the component if there's archival activity (not just ACTIVE)
  if (currentPhase === ArchivalPhase.ACTIVE) {
    return null
  }

  const currentConfig = getArchivalPhaseConfig(currentPhase)
  const CurrentIcon = currentConfig.icon

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <>
      <Paper
        elevation={3}
        onClick={handleClick}
        sx={{
          width: 120,
          height: 80,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          border: `3px solid ${currentConfig.colorHex}`,
          borderRadius: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 1)',
            transform: 'scale(1.05)',
          },
          transition: 'all 0.2s ease-in-out',
        }}
      >
        <CurrentIcon
          fontSize="large"
          sx={{
            color: currentConfig.colorHex,
            mb: 0.5,
          }}
        />
        <Typography
          variant="caption"
          textAlign="center"
          textTransform="uppercase"
          letterSpacing="0.5px"
          lineHeight={1.1}
          fontWeight="bold"
          color={currentConfig.colorHex}
        >
          {currentConfig.label}
        </Typography>
      </Paper>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <Stack direction="column" spacing={1} p={1} minWidth={320}>
          <ArchivalPhaseDetails
            evaluation={evaluation}
            currentPhase={currentPhase}
            currentConfig={currentConfig}
          />
        </Stack>
      </Menu>
    </>
  )
}

export default EvaluationArchivalStatus
