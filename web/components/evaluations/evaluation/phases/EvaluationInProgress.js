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
import { useSnackbar } from '@/context/SnackbarContext'
import { Stack, Typography } from '@mui/material'
import { useCallback } from 'react'
import EvaluationTitleBar from '../layout/EvaluationTitleBar'
import JoinClipboard from '../../JoinClipboard'
import StudentProgressGrid from './progress/StudentProgressGrid'
import MinutesSelector from './progress/MinutesSelector'
import EvaluationCountDown from './progress/EvaluationCountDown'
import { EvaluationPhase } from '@prisma/client'

const EvaluationInProgress = ({
  groupScope,
  evaluation,
  attendance,
  progress,
  onDurationChanged,
}) => {
  const evaluationId = evaluation.id

  const { show: showSnackbar } = useSnackbar()

  const handleDurationChange = useCallback(
    async (newEndAt) => {
      // get time from newEndAt date
      const time = new Date(newEndAt).toLocaleTimeString()
      await fetch(`/api/${groupScope}/evaluations/${evaluationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ endAt: newEndAt }),
      })
        .then(async (reponse) => {
          if (reponse.ok) {
            onDurationChanged(await reponse.json(), false)
            showSnackbar(`evaluation will end at ${time}`)
          } else {
            reponse.json().then((json) => {
              showSnackbar(json.message, 'error')
            })
          }
        })
        .catch(() => {
          showSnackbar('Error during duration change', 'error')
        })
    },
    [evaluationId, onDurationChanged, showSnackbar, groupScope],
  )

  if (!attendance || !progress) {
    return null
  }

  return (
    <Stack flex={1} px={1}>
      <EvaluationTitleBar
        title="Student Progress"
        action={<JoinClipboard evaluationId={evaluationId} />}
      />

      {evaluation.phase === EvaluationPhase.IN_PROGRESS &&
        evaluation.durationActive && (
          <DurationManager
            evaluation={evaluation}
            onChange={handleDurationChange}
          />
        )}

      <StudentProgressGrid
        groupScope={groupScope}
        evaluationId={evaluationId}
        students={attendance.registered}
        progress={progress}
      />
    </Stack>
  )
}

const DurationManager = ({ evaluation, onChange, onEvaluationEnd }) => {
  return (
    <Stack pt={4} pb={4} spacing={2}>
      <Stack
        spacing={4}
        direction="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <MinutesSelector
          label={'Reduce by'}
          color="primary"
          onClick={async (minutes) => {
            // remove minutes to endAt
            let newEndAt = new Date(evaluation.endAt)
            newEndAt.setMinutes(newEndAt.getMinutes() - minutes)
            newEndAt = new Date(newEndAt).toISOString()
            onChange(newEndAt)
          }}
        />
        <Stack direction={'row'} alignItems={'center'} spacing={2}>
          <Typography variant="body1">
            {`Started at ${new Date(evaluation.startAt).toLocaleTimeString()}`}
          </Typography>
          <EvaluationCountDown
            startDate={evaluation.startAt}
            endDate={evaluation.endAt}
            onFinish={onEvaluationEnd}
          />
          <Typography variant="body1">
            {`Ends at ${new Date(evaluation.endAt).toLocaleTimeString()}`}
          </Typography>
        </Stack>
        <MinutesSelector
          label={'Extend for'}
          color="info"
          onClick={async (minutes) => {
            // add minutes to endAt
            let newEndAt = new Date(evaluation.endAt)
            newEndAt.setMinutes(newEndAt.getMinutes() + minutes)
            newEndAt = new Date(newEndAt).toISOString()
            onChange(newEndAt)
          }}
        />
      </Stack>
    </Stack>
  )
}

export default EvaluationInProgress
