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
import Overlay from '@/components/ui/Overlay'
import AlertFeedback from '@/components/feedback/AlertFeedback'
import { Stack, Typography } from '@mui/material'

/**
 * Helper functions to check error types
 */
export const isAccessListError = (error) => error?.id === 'access-list'
export const isIpRestrictionError = (error) => error?.id === 'ip-restriction'
export const isDesktopAppRequiredError = (error) =>
  error?.id === 'desktop-app-required'

/**
 * Main component that handles all evaluation restrictions
 * Renders the appropriate restriction dialog if there's an error,
 * otherwise renders children
 */
export const EvaluationRestrictionGuard = ({ error, children }) => {
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
      <Overlay>
        <AlertFeedback severity="error">
          <Stack spacing={1}>
            <Typography variant="h5">Desktop Application Required</Typography>
            <Typography variant="body2">{errorMessage}</Typography>
          </Stack>
        </AlertFeedback>
      </Overlay>
    )
  }

  // No restriction error, render children
  return children
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
