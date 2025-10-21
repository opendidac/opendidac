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
import { Step, StepConnector, StepLabel, Stepper, Stack } from '@mui/material'
import StatusDisplay from '@/components/feedback/StatusDisplay'

const SnippetStatuBar = ({ statuses }) => {
  return (
    <Stepper activeStep={-1}>
      {statuses?.length > 0 &&
        statuses.map((status, index) => (
          <React.Fragment key={`status-${index}`}>
            <Step completed={true}>
              <StepLabel>
                <Stack
                  direction={'row'}
                  spacing={1}
                  alignItems={'center'}
                  height={20}
                >
                  <StatusDisplay status={status} />
                </Stack>
              </StepLabel>
            </Step>
            <StepConnector />
          </React.Fragment>
        ))}
    </Stepper>
  )
}

export default SnippetStatuBar
