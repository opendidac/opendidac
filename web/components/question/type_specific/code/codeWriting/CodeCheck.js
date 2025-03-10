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
import { useState, useCallback } from 'react'

import { Stack, Typography, Alert, TextField } from '@mui/material'
import { LoadingButton } from '@mui/lab'

import { useSnackbar } from '@/context/SnackbarContext'
import { useBottomPanel } from '@/context/BottomPanelContext'

import BottomPanelHeader from '@/components/layout/utils/BottomPanelHeader'
import BottomPanelContent from '@/components/layout/utils/BottomPanelContent'

import TestCaseResults from './TestCaseResults'

const CodeCheck = ({
  codeCheckAction,
  lockCodeCheck = false,
  enabled = true,
}) => {
  const { show: showSnackbar } = useSnackbar()

  const [beforeAll, setBeforeAll] = useState(null)
  const [tests, setTests] = useState([])
  const [codeCheckRunning, setCodeCheckRunning] = useState(false)
  const { openPanel } = useBottomPanel()

  const runCodeCheck = useCallback(async () => {
    setCodeCheckRunning(true)
    setTests(null)
    setBeforeAll(null)
    codeCheckAction()
      .then((res) => res.json())
      .then((data) => {
        setCodeCheckRunning(false)
        setTests(data.tests)
        setBeforeAll(data.beforeAll)
        openPanel()
      })
      .catch((_) => {
        showSnackbar('Error running test', 'error')
        setTests(null)
        setBeforeAll(null)
        setCodeCheckRunning(false)
        openPanel()
      })
  }, [codeCheckAction, showSnackbar, openPanel])

  return enabled ? (
    <Stack maxHeight={'calc(100% - 90px)'}>
      <BottomPanelHeader>
        <LoadingButton
          size="small"
          variant="contained"
          color="info"
          onClick={runCodeCheck}
          disabled={lockCodeCheck}
          loading={codeCheckRunning}
        >
          Code Check
        </LoadingButton>
      </BottomPanelHeader>
      <BottomPanelContent>
        {tests && (
          <Stack>
            {tests.length > 0 && (
              <Alert
                severity={
                  tests.every((result) => result.passed) ? 'success' : 'error'
                }
              >
                <Typography variant="body2">
                  {tests.every((test) => test.passed)
                    ? 'All test cases passed'
                    : `${tests.filter((test) => !test.passed).length} of ${
                        tests.length
                      } test cases failed`}
                </Typography>
              </Alert>
            )}
            {beforeAll && (
              <Stack padding={0}>
                <TextField
                  variant="filled"
                  fullWidth
                  multiline
                  maxRows={15}
                  focused
                  color="info"
                  label="Console"
                  value={beforeAll}
                  InputProps={{
                    readOnly: true,
                    // monospace font
                    style: { fontFamily: 'monospace' },
                  }}
                />
              </Stack>
            )}
            {tests.length > 0 && (
              <Stack spacing={1} direction="row" pb={2}>
                <TestCaseResults tests={tests} />
              </Stack>
            )}
          </Stack>
        )}
      </BottomPanelContent>
    </Stack>
  ) : null
}

export default CodeCheck
