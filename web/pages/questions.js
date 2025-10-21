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
import React, { useState } from 'react'
import { Role } from '@prisma/client'
import IndexPage from '../components/IndexPage'
import Authorization from '../components/security/Authorization'
/*
Needs to be keept for some time for the user to clear the cache
TODO : REMOVE THIS PAGE in february 2024
*/

import DialogFeedback from '../components/feedback/DialogFeedback'
import { Stack, Typography } from '@mui/material'
// Import necessary components for the dialog
// (e.g., Material-UI, React Bootstrap, etc., depending on what you use)

const LegacyQuestionPage = () => {
  // State to manage the visibility of the dialog
  const [showDialog, setShowDialog] = useState(true)

  // Handler for when the user confirms the action
  const handleConfirm = () => {
    // Code to clear browser cache or instruct the user to do so
    // ...

    // Hide the dialog
    setShowDialog(false)
  }

  return (
    <Authorization allowRoles={[Role.PROFESSOR]}>
      <DialogFeedback
        open={showDialog}
        title="Clear Browser Cache"
        hideCancel
        content={
          <Stack spacing={1}>
            <Typography variant="body2">
              We&apos;ve updated our app to include group scoping in the URL. As
              a result, this page&apos;s location has changed.
            </Typography>
            <Typography variant="body2">
              To ensure a smooth transition and avoid unnecessary redirections,{' '}
              <b>please clear your browser cache</b>.
            </Typography>
            <Typography variant="body2">
              If you need guidance on how to do this:
              <a
                href="https://www.refreshyourcache.com/en/home/"
                target="_blank"
                rel="noreferrer"
              >
                click here for step-by-step instructions.
              </a>
            </Typography>
            <Typography variant="body2">
              Once you click &quot;Confirm&quot; below, you&apos;ll be
              redirected to the new page location.
            </Typography>
          </Stack>
        }
        onConfirm={handleConfirm}
      />

      {/* Render IndexPage only if the dialog has been confirmed */}
      {!showDialog && <IndexPage />}
    </Authorization>
  )
}

export default LegacyQuestionPage
