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
import { Stack, Typography, Button } from '@mui/material'
import { useCallback } from 'react'
import Link from 'next/link'
import DownloadIcon from '@mui/icons-material/Download'
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

  const handleAdjustDuration = useCallback(
    async (action, minutes) => {
      await fetch(`/api/${groupScope}/evaluations/${evaluationId}/progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ action, amountMinutes: minutes }),
      })
        .then(async (response) => {
          if (response.ok) {
            const updated = await response.json()
            const time = new Date(updated.endAt).toLocaleTimeString()
            onDurationChanged(updated, false)
            showSnackbar(`evaluation will end at ${time}`)
          } else {
            response.json().then((json) => {
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
        action={
          <Stack direction="row" spacing={2} alignItems="center">
            {evaluation.desktopAppRequired && (
              <Button
                component={Link}
                href="/downloads"
                variant="text"
                size="small"
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<DownloadIcon />}
              >
                Download Desktop App
              </Button>
            )}
            <JoinClipboard
              evaluationId={evaluationId}
              desktopAppRequired={evaluation.desktopAppRequired || false}
            />
          </Stack>
        }
      />

      {evaluation.phase === EvaluationPhase.IN_PROGRESS &&
        evaluation.durationActive && (
          <DurationManager
            evaluation={evaluation}
            onAdjust={handleAdjustDuration}
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

const DurationManager = ({ evaluation, onAdjust, onEvaluationEnd }) => {
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
            onAdjust('reduce', minutes)
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
            onAdjust('extend', minutes)
          }}
        />
      </Stack>
    </Stack>
  )
}

export default EvaluationInProgress
