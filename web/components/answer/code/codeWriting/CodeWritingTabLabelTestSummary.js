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
import PassIndicator from '@/components/feedback/PassIndicator'
import { Stack, Typography } from '@mui/material'

const CodeWritingTabLabelTestSummary = ({ testCaseResults }) => {
  return (
    testCaseResults && (
      <Stack spacing={1} direction="row">
        {testCaseResults.length > 0 ? (
          <>
            <PassIndicator
              passed={testCaseResults.every((test) => test.passed)}
            />
            <Typography variant="caption">
              {`${testCaseResults.filter((test) => test.passed).length} / ${
                testCaseResults.length
              } tests passed`}
            </Typography>
          </>
        ) : (
          <Typography variant="caption">No code-check runs</Typography>
        )}
      </Stack>
    )
  )
}

export default CodeWritingTabLabelTestSummary
