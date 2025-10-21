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
import React, { useCallback, useState } from 'react'
import { DatabaseQueryOutputStatus } from '@prisma/client'
import {
  Button,
  MenuItem,
  Stack,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material'
import { LoadingButton } from '@mui/lab'

import InlineMonacoEditor from '@/components/input/InlineMonacoEditor'
import DropDown from '@/components/input/DropDown'
import QueryOutput from '@/components/question/type_specific/database/QueryOutput'

const StudentQueryConsole = ({
  evaluationId,
  questionId,
  open,
  studentQueries,
  onClose,
}) => {
  const [sql, setSql] = useState('')
  const [order, setOrder] = useState(0)

  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(undefined)

  const runConsole = useCallback(async () => {
    setRunning(true)
    setResult({
      status: DatabaseQueryOutputStatus.RUNNING,
    })
    const response = await fetch(
      `/api/sandbox/evaluations/${evaluationId}/questions/${questionId}/student/database/console`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          query: sql,
          at: order,
        }),
      },
    ).then((res) => res.json())
    setResult(response)
    setRunning(false)
  }, [evaluationId, questionId, sql, order])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">Console</DialogTitle>
      <DialogContent>
        <Stack width={'600px'}>
          <InlineMonacoEditor
            code={sql}
            language={'sql'}
            onChange={(sql) => {
              setSql(sql)
            }}
          />
          <QueryOutput
            color={'info'}
            header={
              result?.status === DatabaseQueryOutputStatus.ERROR
                ? result.order === order + 1
                  ? 'Error at console query'
                  : `Error at query #${result.order}`
                : result?.status === DatabaseQueryOutputStatus.RUNNING &&
                  'Running'
            }
            result={result}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Stack
          width={'100%'}
          direction={'row'}
          spacing={1}
          alignItems={'center'}
          justifyContent={'space-between'}
        >
          <Stack direction={'row'} spacing={1}>
            <DropDown
              size={'small'}
              variant={'outlined'}
              defaultValue={order}
              onChange={(order) => {
                setResult(undefined)
                setOrder(order)
              }}
            >
              <MenuItem value={0}>Before All</MenuItem>
              {studentQueries.map((query) => (
                <MenuItem key={query.id} value={query.order}>
                  #{query.order} - {query.title}
                </MenuItem>
              ))}
            </DropDown>
          </Stack>
          <Stack direction={'row'} spacing={1}>
            <Button onClick={onClose}>Cancel</Button>
            <LoadingButton
              loading={running}
              variant="contained"
              color="success"
              onClick={() => runConsole()}
              autoFocus
            >
              Run
            </LoadingButton>
          </Stack>
        </Stack>
      </DialogActions>
    </Dialog>
  )
}

export default StudentQueryConsole
