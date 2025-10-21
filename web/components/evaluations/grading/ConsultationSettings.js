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

import { useEffect, useState } from 'react'
import ToggleWithLabel from '@/components/input/ToggleWithLabel'
import { Alert, AlertTitle, Typography, Stack } from '@mui/material'

const ConsultationSettings = ({ evaluation, onChange }) => {
  const [showSolutionsWhenFinished, setShowSolutionsWhenFinished] = useState(
    evaluation.showSolutionsWhenFinished,
  )
  const [consultationEnabled, setConsultationEnabled] = useState(
    evaluation.consultationEnabled,
  )

  useEffect(() => {
    setShowSolutionsWhenFinished(evaluation.showSolutionsWhenFinished)
    setConsultationEnabled(evaluation.consultationEnabled)
  }, [evaluation.showSolutionsWhenFinished, evaluation.consultationEnabled])

  const handleConsultationChange = (checked) => {
    setConsultationEnabled(checked)
    if (!checked) {
      setShowSolutionsWhenFinished(false)
      onChange(checked, false)
    } else {
      onChange(checked, showSolutionsWhenFinished)
    }
  }

  const handleSolutionsChange = (checked) => {
    setShowSolutionsWhenFinished(checked)
    onChange(consultationEnabled, checked)
  }

  return (
    <>
      <Typography variant="h5">Consultation settings</Typography>
      <Stack spacing={2}>
        <Stack spacing={2} direction="row">
          <ToggleWithLabel
            label="Enable consultation after grading"
            checked={consultationEnabled}
            onChange={(e) => handleConsultationChange(e.target.checked)}
          />
          <ToggleWithLabel
            label="Allow student to view official solutions"
            checked={showSolutionsWhenFinished}
            disabled={!consultationEnabled}
            onChange={(e) => handleSolutionsChange(e.target.checked)}
          />
        </Stack>

        <Alert severity="info">
          <AlertTitle>Enable consultation after grading</AlertTitle>
          <Typography variant="body2">
            Controls whether students can view their feedback, grades, or other
            consultation data after the grading phase.
          </Typography>
          <Typography variant="body2">
            - For <b>Exams</b>, consultation is disabled by default to ensure
            that students cannot access feedback or grades after the exam is
            over, maintaining confidentiality.
          </Typography>
          <Typography variant="body2">
            - For <b>TE (tests)</b> and <b>Training</b>, consultation is
            typically enabled to offer valuable feedback for continuous
            improvement and learning.
          </Typography>
          <Typography variant="body2">
            Note: Disabling consultation will also disable the ability to show
            solutions.
          </Typography>
        </Alert>

        <Alert severity="info">
          <AlertTitle>Allow student to view official solutions</AlertTitle>
          <Typography variant="body2">
            Controls whether students can see the official solutions to the
            evaluation once it is completed.
          </Typography>
          <Typography variant="body2">
            - For <b>Exams</b> and <b>TE (tests)</b>, this setting should
            generally be disabled to maintain confidentiality.
          </Typography>
          <Typography variant="body2">
            - For <b>Training</b>, enabling this setting helps students compare
            their answers with the correct ones, fostering learning.
          </Typography>
        </Alert>
      </Stack>
    </>
  )
}

export default ConsultationSettings
