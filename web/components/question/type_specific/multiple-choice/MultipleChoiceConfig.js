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
import UserHelpPopper from '@/components/feedback/UserHelpPopper'
import CheckboxLabel from '@/components/input/CheckboxLabel'
import { Stack, Alert, AlertTitle, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import GradingSetup from '../../GradingSetup'
import { QuestionType } from '@prisma/client'

const MultipleChoiceConfig = ({
  groupScope,
  questionId,
  multipleChoice,
  onPropertyChange,
  onUpdate,
}) => {
  const [activateStudentComment, setAllowStudentComment] = useState(
    multipleChoice?.activateStudentComment,
  )
  const [studentCommentLabel, setStudentCommentLabel] = useState(
    multipleChoice?.studentCommentLabel,
  )

  const [activateSelectionLimit, setActivateSelectionLimit] = useState(
    multipleChoice?.activateSelectionLimit,
  )

  useEffect(() => {
    setAllowStudentComment(multipleChoice?.activateStudentComment)
    if (
      multipleChoice?.activateStudentComment &&
      multipleChoice?.studentCommentLabel === null
    ) {
      onPropertyChange('studentCommentLabel', 'Explain your answer here.')
      return
    }
    setStudentCommentLabel(multipleChoice?.studentCommentLabel)
    setActivateSelectionLimit(multipleChoice?.activateSelectionLimit)
  }, [multipleChoice, onPropertyChange])

  const debounceOnPropertyChange = useDebouncedCallback(onPropertyChange, 500)

  return (
    <Stack flex={1} spacing={1}>
      <Stack
        direction="row"
        spacing={1}
        alignItems={'center'}
        justifyContent={'space-between'}
      >
        <Stack direction="row" alignItems={'center'}>
          <CheckboxLabel
            label="Activate student comment"
            checked={activateStudentComment}
            onChange={(checked) => {
              setAllowStudentComment(checked)
              onPropertyChange('activateStudentComment', checked)
            }}
          />
          <UserHelpPopper>
            <Alert severity="info">
              <AlertTitle>Activate student comment</AlertTitle>
              <Typography variant="body2">
                An input field will be displayed to the student to provide an
                explanation for their answer.
              </Typography>
            </Alert>
            <Alert severity="info">
              <AlertTitle>Student comment label</AlertTitle>
              <Typography variant="body2">
                The label of the input field where the student will provide
                their explanation.
              </Typography>
            </Alert>
          </UserHelpPopper>
          <CheckboxLabel
            label="Activate selection limit"
            checked={activateSelectionLimit}
            onChange={(checked) => {
              setActivateSelectionLimit(checked)
              onPropertyChange('activateSelectionLimit', checked)
            }}
          />
          <UserHelpPopper>
            <Alert severity="info">
              <AlertTitle>Selection limit</AlertTitle>
              <Typography variant="body2">
                The student wont be able to select more than the number of
                correct options.
              </Typography>
              <Typography variant="body2">
                The student will be informed how many options are expected.
              </Typography>
            </Alert>
          </UserHelpPopper>
        </Stack>

        <GradingSetup
          groupScope={groupScope}
          questionId={questionId}
          questionType={QuestionType.multipleChoice}
          gradingPolicy={multipleChoice?.gradingPolicy}
          onPropertyChange={onPropertyChange}
          onUpdate={() => onUpdate()}
        />
      </Stack>
      {activateStudentComment && studentCommentLabel !== null && (
        <TextField
          label="Student comment label"
          variant="standard"
          value={studentCommentLabel}
          fullWidth
          size={'small'}
          onChange={(e) => {
            setStudentCommentLabel(e.target.value)
            debounceOnPropertyChange('studentCommentLabel', e.target.value)
          }}
          sx={{
            ml: 0.5,
          }}
        />
      )}
    </Stack>
  )
}

export default MultipleChoiceConfig
