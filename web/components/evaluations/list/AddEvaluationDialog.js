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

import { useRouter } from 'next/router'
import { Autocomplete, Stack, TextField, Typography } from '@mui/material'

import { useSnackbar } from '@/context/SnackbarContext'
import DialogFeedback from '@/components/feedback/DialogFeedback'
import { useEffect, useState } from 'react'
import CardSelector from '@/components/input/CardSelector'
import {
  EvaluationPhase,
  QuestionSource,
  UserOnEvaluationAccessMode,
} from '@prisma/client'
import useSWR from 'swr'
import { fetcher } from '@/core/utils'
import { phaseGT } from '@/core/phase'
import UserHelpPopper from '@/components/feedback/UserHelpPopper'

const Presets = [
  {
    value: 'exam',
    label: 'Final Exam',
    description: 'Formal course-ending exams.',
    settings: {
      showSolutionWhenFinished: false, // No solutions after exam
      restrictAccess: true, // Restricted access only
      consultationEnabled: false, // Consultation is disabled for exams
      desktopAppRequired: false, // Desktop app requirement disabled by default
    },
  },
  {
    value: 'te',
    label: 'Test (TE)',
    description: 'Written tests taken throughout the semester.',
    settings: {
      showSolutionWhenFinished: true, // Solutions available after TE is finished
      restrictAccess: true, // Restricted access for TE
      consultationEnabled: true, // Consultation is allowed for TE
      desktopAppRequired: false, // Desktop app requirement disabled by default
    },
  },
  {
    value: 'training',
    label: 'Training',
    description: 'For homework and training purposes.',
    settings: {
      showSolutionWhenFinished: true, // Solutions available after training
      restrictAccess: false, // No restrictions for training
      consultationEnabled: true, // Consultation is allowed
      desktopAppRequired: false, // Desktop app requirement disabled by default
    },
  },
  {
    value: 'from_existing',
    label: 'Start-over an existing evaluation',
    description: 'Chose an existing evaluation as a template',
    settings: {},
  },
]

const AddEvaluationDialog = ({ existingEvaluations, open, onClose }) => {
  const router = useRouter()

  const { groupScope } = router.query

  const { show: showSnackbar } = useSnackbar()

  const [preset, setPreset] = useState('exam')

  const [templateEvaluation, setTemplateEvaluation] = useState(null)
  const [input, setInput] = useState('')

  useEffect(() => {
    setTemplateEvaluation(null)
  }, [preset])

  const handleAdd = async () => {
    await fetch(`/api/${groupScope}/evaluations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        preset: Presets.find((p) => p.value === preset),
        templateEvaluation: templateEvaluation,
      }),
    }).then((res) => {
      res.json().then((data) => {
        if (res.ok) {
          showSnackbar('Evaluation created successfully', 'success')
          onClose()
          router.push(`/${groupScope}/evaluations/${data.id}`)
        } else {
          showSnackbar(data.message, 'error')
        }
      })
    })
  }

  const handleChange = (preset) => {
    setPreset(preset)
  }

  const getPresetSettings = (preset) => {
    if (preset === 'from_existing') {
      const selected = existingEvaluations.find(
        (e) => e.id === templateEvaluation?.id,
      )
      if (!selected) {
        return null
      } else {
        return {
          showSolutionWhenFinished: selected.showSolutionsWhenFinished,
          restrictAccess:
            selected.accessMode ===
            UserOnEvaluationAccessMode.LINK_AND_ACCESS_LIST,
          grade: selected.grade || true,
          desktopAppRequired: selected.desktopAppRequired || false,
        }
      }
    }
    return Presets.find((p) => p.value === preset).settings
  }

  return (
    <DialogFeedback
      open={open}
      onClose={onClose}
      title="Create a new evaluation"
      content={
        <Stack spacing={2} sx={{ width: '750px' }}>
          <Typography variant="body1">
            Please select the type of evaluation you want to create
          </Typography>
          <CardSelector
            options={Presets}
            selected={preset}
            onSelect={handleChange}
          />

          {preset === 'from_existing' && (
            <Autocomplete
              id="evaluation-id"
              inputValue={input}
              options={existingEvaluations || []}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Find the evaluation to use as a template"
                  error={!templateEvaluation}
                  helperText={
                    templateEvaluation ? '' : 'Please select an evaluation'
                  }
                />
              )}
              noOptionsText="No evaluations found"
              onInputChange={(_, value) => setInput(value)}
              onChange={(_, value) => {
                setTemplateEvaluation(value)
              }}
            />
          )}

          <Stack spacing={1}>
            {preset !== 'from_existing' ? (
              <Typography variant="h6">Selected preset details</Typography>
            ) : (
              <Typography variant="h6">Selected evaluation details</Typography>
            )}
            <PresetSummary preset={getPresetSettings(preset)} />

            {templateEvaluation && (
              <EvaluationSummary
                groupScope={groupScope}
                evaluationId={templateEvaluation?.id}
              />
            )}
          </Stack>
        </Stack>
      }
      onConfirm={handleAdd}
    />
  )
}

const EvaluationSummary = ({ groupScope, evaluationId }) => {
  const { data: evaluation } = useSWR(
    `/api/${groupScope}/evaluations/${evaluationId}`,
    fetcher,
  )
  const { data: composition } = useSWR(
    `/api/${groupScope}/evaluations/${evaluationId}/composition`,
    fetcher,
  )

  // Check if evaluation exists
  if (!evaluation) return null

  const afterComposition = phaseGT(
    evaluation.phase,
    EvaluationPhase.COMPOSITION,
  )

  const hasQuestions = Boolean(composition?.length)

  const countMissingQuestions = composition?.filter(
    (q) =>
      afterComposition &&
      q.question?.source === QuestionSource.EVAL &&
      !q.question.sourceQuestion,
  ).length

  const hasAccessList =
    evaluation.accessMode === UserOnEvaluationAccessMode.LINK_AND_ACCESS_LIST ||
    Boolean(evaluation.accessList?.length)

  const hasConditions = Boolean(evaluation.conditions?.length)

  return (
    <>
      {hasAccessList && (
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2">
            The access list contains{' '}
            <b>{evaluation.accessList?.length || 0} emails</b>
          </Typography>
        </Stack>
      )}

      {hasQuestions && (
        <Typography variant="body2">
          Contains <b>{composition.length} questions</b>.
        </Typography>
      )}

      {countMissingQuestions > 0 && (
        <Typography variant="body2" color={'error'}>
          <b>{countMissingQuestions} questions</b> used in this evaluation no
          longer exist in the question bank
        </Typography>
      )}

      {countMissingQuestions === 0 && (
        <Typography variant="body2" color={'info'}>
          All questions are still available in the question bank
        </Typography>
      )}

      {hasConditions && (
        <Typography variant="body2">Conditions are set</Typography>
      )}
    </>
  )
}

const handleAccessAfterGrading = (preset) => {
  if (!preset.consultationEnabled) {
    return 'Access to feedback and solutions is disabled for this exam. No consultation is allowed.'
  } else if (preset.showSolutionsWhenFinished) {
    return 'Solutions and feedback are available. The students can consult their results.'
  } else {
    return 'Feedback is available, but no solutions are provided.'
  }
}

const PresetSummary = ({ preset }) => {
  return (
    preset && (
      <>
        <Stack direction="row" alignItems="center">
          <Typography variant="body2">
            {preset.desktopAppRequired ? (
              <>
                Desktop application <b>is</b> required to access this evaluation
              </>
            ) : (
              <>
                Desktop application <b>is not</b> required to access this
                evaluation
              </>
            )}
          </Typography>
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
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2">
            {handleAccessAfterGrading(preset)}
          </Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between">
          {preset.restrictAccess ? (
            <Typography variant="body2">
              Access <b>is</b> restricted to the evaluation
            </Typography>
          ) : (
            <Typography variant="body2">
              Access <b>is not</b> restricted to the evaluation
            </Typography>
          )}
        </Stack>
      </>
    )
  )
}

export default AddEvaluationDialog
