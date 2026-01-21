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

import React from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import useSWR from 'swr'
import Overlay from '@/components/ui/Overlay'
import AlertFeedback from '@/components/feedback/AlertFeedback'
import { Stack, Typography, Button, Box, Divider } from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import JoinClipboard from '@/components/evaluations/JoinClipboard'
import { fetcher } from '@/core/database'

/**
 * Helper functions to check error types
 */
export const isAccessListError = (error) => error?.id === 'access-list'
export const isIpRestrictionError = (error) => error?.id === 'ip-restriction'
export const isDesktopAppRequiredError = (error) =>
  error?.id === 'desktop-app-required'
export const isTooLateToJoinError = (error) => error?.id === 'too-late-to-join'
export const isEvaluationPurgedError = (error) =>
  error?.id === 'evaluation-purged'

/**
 * Main component that handles all evaluation restrictions
 * Renders the appropriate restriction dialog if there's an error,
 * otherwise renders children
 */
export const EvaluationRestrictionGuard = ({
  error,
  children,
  evaluationId,
}) => {
  const router = useRouter()

  // Get evaluationId from prop or router
  const currentEvaluationId = evaluationId || router?.query?.evaluationId

  if (!error) {
    return children
  }

  const errorMessage = error?.message

  if (isAccessListError(error)) {
    return (
      <Overlay>
        <AlertFeedback severity="warning">
          <Stack spacing={1}>
            <Typography variant="h5">
              You are not allowed to participate
            </Typography>
            <Typography variant="body2">{errorMessage}</Typography>
          </Stack>
        </AlertFeedback>
      </Overlay>
    )
  }

  if (isIpRestrictionError(error)) {
    return (
      <Overlay>
        <AlertFeedback severity="warning">
          <Stack spacing={1}>
            <Typography variant="h5">
              You are not allowed to participate
            </Typography>
            <Typography variant="body2">{errorMessage}</Typography>
          </Stack>
        </AlertFeedback>
      </Overlay>
    )
  }

  if (isDesktopAppRequiredError(error)) {
    return (
      <DesktopAppRequiredMessage
        evaluationId={currentEvaluationId}
        router={router}
      />
    )
  }

  if (isTooLateToJoinError(error) || isEvaluationPurgedError(error)) {
    return (
      <Overlay>
        <AlertFeedback severity="error">
          <Stack spacing={1}>
            <Typography variant="h5">Too Late to Join</Typography>
            <Typography variant="body2" color="text.secondary">
              The evaluation cannot be joined anymore.
            </Typography>
          </Stack>
        </AlertFeedback>
      </Overlay>
    )
  }

  // No restriction error, render children
  return children
}

/**
 * Component for displaying desktop app required message with PIN instructions
 */
const DesktopAppRequiredMessage = ({ evaluationId, router }) => {
  const { groupScope } = router?.query || {}

  // Try to fetch evaluation data to get PIN and groupScope
  // This may not always work if groupScope is not in URL (e.g., student pages)
  const { data: evaluation } = useSWR(
    evaluationId && groupScope
      ? `/api/${groupScope}/evaluations/${evaluationId}`
      : null,
    fetcher,
  )

  const pin = evaluation?.pin
  const evaluationGroupScope = evaluation?.group?.scope || groupScope

  return (
    <Overlay>
      <AlertFeedback severity="info">
        <Stack spacing={2}>
          <Stack spacing={1}>
            <Typography variant="h5">Desktop Application Required</Typography>
            <Typography variant="body2">
              This evaluation must be opened using the official OpenDidac
              Desktop application.
            </Typography>
            <Typography variant="body1">
              It is not allowed to participate in this evaluation using a
              browser or any other tools.
            </Typography>
          </Stack>

          <Divider />

          <Stack spacing={1}>
            <Typography variant="h6" fontWeight="bold">
              How to continue:
            </Typography>

            <Stack spacing={1.5}>
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Step 1: Install the Desktop Application
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  <b>If you don&apos;t have OpenDidac Desktop yet</b>, download
                  and install it on your computer first.
                </Typography>
                <Button
                  component={Link}
                  href="/downloads"
                  variant="text"
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<DownloadIcon />}
                  fullWidth
                >
                  Downloads
                </Button>
              </Box>

              <Box spacing={1}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Step 2: Join using the PIN
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  After installing, open OpenDidac Desktop and enter the{' '}
                  <b>6-character PIN</b> provided by your professor to join the
                  evaluation.
                </Typography>
                {evaluationId && evaluationGroupScope && (
                  <JoinClipboard
                    groupScope={evaluationGroupScope}
                    evaluationId={evaluationId}
                    desktopAppRequired={true}
                    pin={pin}
                  />
                )}
              </Box>
            </Stack>
          </Stack>
        </Stack>
      </AlertFeedback>
    </Overlay>
  )
}

/**
 * Dialog component for evaluation completed status
 */
export const EvaluationCompletedDialog = () => (
  <Overlay>
    <AlertFeedback severity="info">
      <Stack spacing={1}>
        <Typography variant="h5">Evaluation Completed</Typography>
        <Typography variant="body1">
          You have finished your evaluation. Submissions are now closed.
        </Typography>
        <Typography variant="body2">
          If you believe this is an error or if you have any questions, please
          reach out to your professor.
        </Typography>
      </Stack>
    </AlertFeedback>
  </Overlay>
)
