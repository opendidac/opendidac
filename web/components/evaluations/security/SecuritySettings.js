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

import { useEffect, useState } from 'react'
import { Typography, Alert, Stack } from '@mui/material'
import ToggleWithLabel from '@/components/input/ToggleWithLabel'
import UserHelpPopper from '@/components/feedback/UserHelpPopper'
import SettingsIPRestriction from '../evaluation/phases/settings/SettingsIPRestriction'
import SettingsAccessMode from '../evaluation/phases/settings/SettingsAccessMode'

const SecuritySettings = ({ evaluation, onChange }) => {
  const [desktopAppRequired, setDesktopAppRequired] = useState(
    evaluation.desktopAppRequired || false,
  )

  useEffect(() => {
    setDesktopAppRequired(evaluation.desktopAppRequired || false)
  }, [evaluation.desktopAppRequired])

  const handleDesktopAppRequiredChange = (checked) => {
    setDesktopAppRequired(checked)
    onChange({ desktopAppRequired: checked })
  }

  return (
    <>
      <Typography variant="h5">Security Settings</Typography>
      <SettingsAccessMode
        accessMode={evaluation.accessMode}
        accessList={evaluation.accessList}
        onChange={(accessMode, accessList) => {
          onChange({ accessMode, accessList })
        }}
      />
      <SettingsIPRestriction
        evaluation={evaluation}
        onChange={(ipRestrictions) => {
          onChange({ ipRestrictions })
        }}
      />
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <ToggleWithLabel
            label="Require desktop application"
            checked={desktopAppRequired}
            onChange={(e) => handleDesktopAppRequiredChange(e.target.checked)}
          />
          <UserHelpPopper
            ariaLabel="Desktop application requirement information"
            title="Desktop application requirement"
          >
            <Stack spacing={1} sx={{ maxWidth: 520 }}>
              <Typography variant="body2">
                You can make the <b>desktop application mandatory</b> for
                students. This ensures the evaluation runs in a{' '}
                <b>controlled environment</b>.
              </Typography>
              <Typography variant="body2">
                By enforcing the desktop app, the{' '}
                <b>browser context can be better controlled</b> to reduce misuse
                of <b>external tools (e.g., AI assistants)</b>, limit{' '}
                <b>screen overlays</b>, and apply <b>stricter policies</b>.
              </Typography>
              <Typography variant="body2">
                This setting complements other{' '}
                <b>security options (access restrictions, IP rules)</b> and is
                recommended for{' '}
                <b>high‑stakes evaluations such as TE or Final Exams</b>.
              </Typography>
              <Typography variant="body2">
                The desktop application is available for <b>Windows</b>,{' '}
                <b>macOS</b>, and <b>Linux</b> and can be downloaded{' '}
                <a
                  href="/downloads"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'underline' }}
                >
                  here
                </a>
                .
              </Typography>
            </Stack>
          </UserHelpPopper>
        </Stack>
        {desktopAppRequired && (
          <Alert severity="warning" sx={{ fontWeight: 'medium' }}>
            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
              Desktop application <b>is</b> required. <b>No browser access</b>{' '}
              to the evaluation is possible. Students can download the
              application for <b>Windows</b>, <b>macOS</b>, or <b>Linux</b> from
              the{' '}
              <a
                href="/downloads"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'underline', fontWeight: 'bold' }}
              >
                downloads page
              </a>
              .
            </Typography>
          </Alert>
        )}
      </Stack>
    </>
  )
}

export default SecuritySettings
