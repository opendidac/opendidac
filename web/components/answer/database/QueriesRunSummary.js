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
import { DatabaseQueryOutputStatus } from '@prisma/client'
import { Stack, Step, StepConnector, StepLabel, Stepper } from '@mui/material'

import StatusDisplay from '@/components/feedback/StatusDisplay'

const QueriesRunSummary = ({ queries, studentOutputs }) => {
  const getStatus = (query, output) => {
    if (!output) return null
    if (!query.testQuery) {
      // status can be either "RUNNING" or "ERROR", otherwise it's "NEUTRAL"
      const acceptedStatuses = [
        DatabaseQueryOutputStatus.RUNNING,
        DatabaseQueryOutputStatus.ERROR,
      ]
      if (acceptedStatuses.includes(output.output.status))
        return output.output.status
    } else {
      // status can be either "RUNNING", "ERROR"
      // status is "WARNING" if testPassed is false
      // status is "SUCCESS" if testPassed is true
      const acceptedStatuses = [
        DatabaseQueryOutputStatus.RUNNING,
        DatabaseQueryOutputStatus.ERROR,
      ]
      if (acceptedStatuses.includes(output.output.status))
        return output.output.status
      if (output.output.testPassed === true)
        return DatabaseQueryOutputStatus.SUCCESS
      if (output.output.testPassed === false)
        return DatabaseQueryOutputStatus.WARNING
    }
    return DatabaseQueryOutputStatus.NEUTRAL
  }

  return (
    <Stepper activeStep={1}>
      {queries?.length > 0 &&
        queries.map((q, index) => (
          <React.Fragment key={`query-${q.id}`}>
            <Step
              completed={
                studentOutputs[index]?.output?.status ===
                DatabaseQueryOutputStatus.SUCCESS
              }
            >
              <StepLabel>
                <Stack
                  direction={'row'}
                  spacing={1}
                  alignItems={'center'}
                  height={30}
                >
                  <StatusDisplay status={getStatus(q, studentOutputs[index])} />
                </Stack>
              </StepLabel>
            </Step>
            <StepConnector />
          </React.Fragment>
        ))}
    </Stepper>
  )
}

export default QueriesRunSummary
