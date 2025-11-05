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
import { Stack } from '@mui/system'
import { Button, Typography } from '@mui/material'
import { getNextPhase, getPhaseDetails } from '../phases'
import SkipNextIcon from '@mui/icons-material/SkipNext'
import StatusDisplay from '@/components/feedback/StatusDisplay'
import { EvaluationPhase } from '@prisma/client'
import { useState } from 'react'
import DialogFeedback from '@/components/feedback/DialogFeedback'

const dialogConfigurations = {
  [EvaluationPhase.COMPOSITION]: {
    nextPhase: EvaluationPhase.REGISTRATION,
    title: 'End of composition',
    content: (
      <>
        <Typography variant="body1" gutterBottom>
          This evaluation is about to go to the <b>registration</b> phase.
        </Typography>
        <Typography variant="body1" gutterBottom>
          The questions part of the composition <b>will be copied</b> to the
          evaluation.
        </Typography>
        <Typography variant="body1" gutterBottom color="error">
          Any updates to the related questions <b>will not be reflected</b> in
          the evaluation.
        </Typography>
        <Typography variant="body1" gutterBottom color="error">
          You will not be able to modify the composition after this point.
        </Typography>
        <Typography variant="button" gutterBottom>
          Are you sure you want to continue?
        </Typography>
      </>
    ),
  },
  [EvaluationPhase.REGISTRATION]: {
    nextPhase: EvaluationPhase.IN_PROGRESS,
    title: 'Start evaluation',
    content: (
      <>
        <Typography variant="body1" gutterBottom>
          This evaluation is about to go to the <b>in-progress</b> phase.
        </Typography>
        <Typography variant="body1" gutterBottom>
          Registered students will be able to start with their evaluation.
        </Typography>
        <Typography variant="body1" gutterBottom>
          Late registrations are possible.
        </Typography>
        <Typography variant="button" gutterBottom>
          Are you sure you want to start the evaluation?
        </Typography>
      </>
    ),
  },
  [EvaluationPhase.IN_PROGRESS]: {
    nextPhase: EvaluationPhase.GRADING,
    title: 'End evaluation',
    content: (
      <>
        <Typography variant="body1" gutterBottom>
          This evaluation is about to go to the <b>grading</b> phase.
        </Typography>
        <Typography variant="body1" gutterBottom>
          Students will not be able to submit their answers after this point.
        </Typography>
        <Typography variant="button" gutterBottom>
          Are you sure you want to end the evaluation?
        </Typography>
      </>
    ),
  },
  [EvaluationPhase.GRADING]: {
    nextPhase: EvaluationPhase.FINISHED,
    title: 'Finish grading',
    content: (
      <>
        <Typography variant="body1" gutterBottom>
          This evaluation is about to go to the <b>finished</b> phase.
        </Typography>
        <Typography variant="body1" gutterBottom>
          You will <b>still</b> be able to modify grading and feedback.
        </Typography>
        <Typography variant="body1" gutterBottom>
          Students will be able to consult their results and feedback.
        </Typography>

        <Typography variant="button" gutterBottom>
          Are you sure you want to finish the evaluation?
        </Typography>
      </>
    ),
  },
}

const EvaluationActionMenu = ({ groupScope, evaluation, onPhaseChange }) => {
  const { show: showSnackbar } = useSnackbar()
  const [dialogOpen, setDialogOpen] = useState(false)

  const nextPhase = getNextPhase(evaluation.phase)
  const phaseDetails = getPhaseDetails(evaluation.phase)
  const dialogConfig = dialogConfigurations[evaluation.phase]

  const onButtonClick = async () => {
    if (dialogConfig && dialogConfig.nextPhase === nextPhase) {
      setDialogOpen(true)
    } else {
      await changePhase()
    }
  }

  const changePhase = async () => {
    await fetch(`/api/${groupScope}/evaluations/${evaluation.id}/phase`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ phase: nextPhase }),
    }).then((response) => {
      if (response.ok) {
        onPhaseChange?.()
        showSnackbar('Phase changed', 'success')
      }
    })
  }

  const onDialogConfirm = async () => {
    setDialogOpen(false)
    await changePhase()
  }

  return (
    <>
      <Stack direction="row" spacing={2} justifyContent="center">
        {phaseDetails && phaseDetails.nextPhaseButton ? (
          <Button
            variant="text"
            color="info"
            onClick={onButtonClick}
            endIcon={<SkipNextIcon />}
            startIcon={<phaseDetails.nextPhaseButton.icon />}
          >
            {phaseDetails.nextPhaseButton.label}
          </Button>
        ) : (
          <Stack
            direction="column"
            alignItems="stretch"
            spacing={2}
            sx={{ width: '100%' }}
            flex={1}
          >
            <Stack direction="column" alignItems="center" spacing={1} flex={1}>
              <StatusDisplay status={'SUCCESS'} size={48} />
              <Typography variant="h6" color="textSecondary">
                All phases completed
              </Typography>
            </Stack>
          </Stack>
        )}
      </Stack>

      {dialogConfig && (
        <DialogFeedback
          open={dialogOpen}
          title={dialogConfig.title}
          content={dialogConfig.content}
          onClose={() => setDialogOpen(false)}
          onConfirm={onDialogConfirm}
        />
      )}
    </>
  )
}
export default EvaluationActionMenu
