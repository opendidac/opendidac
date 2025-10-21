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
import { useState, useEffect, useCallback } from 'react'
import {
  Stack,
  Box,
  Typography,
  TextField,
  FormControlLabel,
  Switch,
  FormGroup,
  FormHelperText,
} from '@mui/material'
import FileEditor from '@/components/question/type_specific/code/FileEditor'
import useSWR from 'swr'

import ScrollContainer from '@/components/layout/ScrollContainer'
import { fetcher } from '@/code/utils'
import Loading from '@/components/feedback/Loading'
import UserHelpPopper from '@/components/feedback/UserHelpPopper'

const SnippetContext = ({ groupScope, questionId, onUpdate }) => {
  const [studentOutputTest, setStudentOutputTest] = useState(false)
  const [contextExec, setContextExec] = useState('')
  const [context, setContext] = useState({
    contextPath: '',
    context: '',
  })

  const {
    data: codeReading,
    error,
    mutate,
  } = useSWR(
    `/api/${groupScope}/questions/${questionId}/code/code-reading`,
    groupScope && questionId ? fetcher : null,
    { revalidateOnFocus: false },
  )

  useEffect(() => {
    if (!codeReading) return
    setStudentOutputTest(codeReading.studentOutputTest)
    setContextExec(codeReading.contextExec)
    setContext({
      contextPath: codeReading.contextPath,
      context: codeReading.context,
    })
  }, [codeReading])

  const onCodeReadingUpdate = useCallback(
    async (attributeName, updatedAttribute) => {
      const codeReading = {
        studentOutputTest,
        contextExec,
        context: {
          context: context.context,
          contextPath: context.contextPath,
        },
      }

      fetch(`/api/${groupScope}/questions/${questionId}/code/code-reading`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          ...codeReading,
          [attributeName]: updatedAttribute,
        }),
      }).then((data) => data.json())
      onUpdate && onUpdate()
    },
    [groupScope, questionId, onUpdate, studentOutputTest, contextExec, context],
  )

  return (
    <Loading loading={!codeReading} errors={[error]}>
      <Stack spacing={1} height={'100%'} flex={1} overflow={'hidden'}>
        <ScrollContainer pb={12} spacing={1}>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={studentOutputTest}
                  onChange={(e) => {
                    setStudentOutputTest(e.target.checked)
                    onCodeReadingUpdate('studentOutputTest', e.target.checked)
                  }}
                />
              }
              label="Student output testing"
            />
            <FormHelperText>
              Allow students to test their outputs. The students will know if
              their output is correct or not.
            </FormHelperText>
          </FormGroup>

          <Stack direction={'row'} spacing={0} alignItems={'center'}>
            <Typography variant="h6">Snippet execution context</Typography>
            <UserHelpPopper alwaysShow placement="top" mode="info">
              <Box>
                <Typography variant="body2">
                  Each snippet will run in isolation within the context, the
                  program is executed for each snippet.
                </Typography>
                <Typography variant="body2">
                  The context is not directly visible by students. You can use
                  this context to add any required dependencies, functions, or
                  variables
                </Typography>
                <Typography variant="body2">
                  <code>
                    <b>{'{{SNIPPET_FUNCTION_DECLARATIONS}}'}</b>
                  </code>{' '}
                  indicate where the the snippet wrapper functions will be
                  generated
                </Typography>
                <Typography variant="body2">
                  <code>
                    <b>{'{{SNIPPET_FUNCTION_CALLS}}'}</b>
                  </code>{' '}
                  indicate where the the snippet execution dispatcher will be
                  generated
                </Typography>
              </Box>
            </UserHelpPopper>
          </Stack>

          <TextField
            id="context"
            variant="standard"
            label="Context Exec"
            value={contextExec}
            multiline
            fullWidth
            onChange={(ev) => {
              setContextExec(ev.target.value)
              onCodeReadingUpdate('contextExec', ev.target.value)
            }}
          />

          <FileEditor
            file={{
              path: context.contextPath,
              content: context.context,
            }}
            onChange={(code) => {
              const context = {
                context: code.content,
                contextPath: code.path,
              }
              setContext(context)
              onCodeReadingUpdate('context', context)
            }}
          />
        </ScrollContainer>
      </Stack>
    </Loading>
  )
}

export default SnippetContext
