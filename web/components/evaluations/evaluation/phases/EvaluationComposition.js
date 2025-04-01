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
import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { useDebouncedCallback } from 'use-debounce'
import {
  Alert,
  Button,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'

import DragHandleSVG from '@/components/layout/utils/DragHandleSVG'
import DecimalInput from '@/components/input/DecimalInput'
import QuestionTypeIcon from '@/components/question/QuestionTypeIcon'
import ScrollContainer from '@/components/layout/ScrollContainer'
import ReorderableList from '@/components/layout/utils/ReorderableList'
import { phaseGreaterThan } from '../phases'
import { CodeQuestionType, EvaluationPhase, QuestionType } from '@prisma/client'
import QuestionIncludeDrawer from './composition/QuestionIncludeDrawer'
import { useTheme } from '@emotion/react'
import EvaluationTitleBar from '../layout/EvaluationTitleBar'
import { useRouter } from 'next/router'
import UserHelpPopper from '@/components/feedback/UserHelpPopper'

const EvaluationComposition = ({
  groupScope,
  evaluation,
  composition,
  onCompositionChanged,
}) => {
  const evaluationId = evaluation.id
  const [hasWarnings, setHasWarnings] = useState(false)

  const readOnly = phaseGreaterThan(
    evaluation.phase,
    EvaluationPhase.COMPOSITION,
  )

  const [showIncludeDrawer, setShowIncludeDrawer] = useState(false)

  const saveIncludeQuestions = useCallback(
    async (questionIds) => {
      // save included questions
      await fetch(
        `/api/${groupScope}/evaluations/${evaluationId}/composition`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questionIds,
          }),
        },
      )
    },
    [groupScope, evaluationId],
  )

  const onInclude = useCallback(
    async (questionIds) => {
      await saveIncludeQuestions(questionIds)

      onCompositionChanged()
    },
    [saveIncludeQuestions, onCompositionChanged],
  )

  return (
    <Stack flex={1} px={1}>
      <EvaluationTitleBar
        title="Composition"
        action={
          <Button
            variant="text"
            color="primary"
            disabled={readOnly}
            onClick={() => {
              setShowIncludeDrawer(true)
            }}
          >
            Include Questions
          </Button>
        }
      />
      {hasWarnings && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          <Typography variant="body2">
            Some questions have compliance warnings. Hover over the warning icon
            next to the questions to see details.
          </Typography>
        </Alert>
      )}
      {readOnly ? (
        <Alert severity="info">
          <Typography variant="body2">
            This evaluation is locked for composition. The full list of
            questions has been copied to the evaluation.
          </Typography>
        </Alert>
      ) : (
        <Alert severity="info">
          <Typography variant="body2">
            Once you move beyond this phase, the composition will be locked. At
            that stage, the full list of questions will be copied to the
            evaluation.
          </Typography>
        </Alert>
      )}
      <ScrollContainer spacing={1} padding={1} pb={24}>
        <EvaluationCompositionQuestions
          groupScope={groupScope}
          evaluationId={evaluationId}
          composition={composition}
          readOnly={readOnly}
          onCompositionChanged={onCompositionChanged}
          onWarningsChange={setHasWarnings}
        />
      </ScrollContainer>
      <QuestionIncludeDrawer
        open={showIncludeDrawer}
        groupScope={groupScope}
        includedQuestions={composition.map((eq) => eq.question)}
        onInclude={(questionIds) => {
          onInclude(questionIds)
        }}
        onClose={() => {
          setShowIncludeDrawer(false)
        }}
      />
    </Stack>
  )
}

const codeQuestionComplianceCheck = (collectionToQuestions) => {
  const warnings = {}

  for (const collectionToQuestion of collectionToQuestions) {
    // find other question of the type code of opposite code type and same language
    if (collectionToQuestion.question.type == QuestionType.code) {
      const warning =
        'The students may use the code writing code check feature to execute code reading snippets and get the outputs. This can lead to cheating. It is recommended to avoid mixing code reading and code writing questions of the same language in the same collection.'

      const codeType = collectionToQuestion.question.code.codeType
      const language = collectionToQuestion.question.code.language
      const oppositeCodeType =
        codeType === CodeQuestionType.codeWriting
          ? CodeQuestionType.codeReading
          : CodeQuestionType.codeWriting

      const oppositeCodeQuestion = collectionToQuestions.filter(
        (item) =>
          item.question.type === 'code' &&
          item.question.code.codeType === oppositeCodeType &&
          item.question.code.language === language,
      )

      if (oppositeCodeQuestion.length > 0) {
        warnings[collectionToQuestion.question.id] = warning
        for (const oppositeQuestion of oppositeCodeQuestion) {
          warnings[oppositeQuestion.question.id] = warning
        }
      }
    }
  }
  return warnings
}

export const complianceCheck = (evaluationToQuestions) => {
  const warnings = {}

  for (const eq of evaluationToQuestions) {
    switch (eq.question.type) {
      case QuestionType.code:
        Object.assign(
          warnings,
          codeQuestionComplianceCheck(evaluationToQuestions),
        )
        break
      default:
        break
    }
  }

  return warnings
}

const EvaluationCompositionQuestions = ({
  groupScope,
  evaluationId,
  composition,
  readOnly,
  onCompositionChanged,
  onWarningsChange,
}) => {
  const [questions, setQuestions] = useState(composition)

  useEffect(() => {
    setQuestions(composition)
  }, [composition])

  useEffect(() => {
    const warnings = complianceCheck(composition)
    onWarningsChange?.(Object.keys(warnings).length > 0)
  }, [composition, onWarningsChange])

  const saveReOrder = useCallback(
    async (reordered) => {
      // save question order
      await fetch(
        `/api/${groupScope}/evaluations/${evaluationId}/composition/order`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questions: reordered,
          }),
        },
      )
    },
    [groupScope, evaluationId],
  )

  const debounceSaveOrdering = useDebouncedCallback(saveReOrder, 300)

  const onChangeOrder = useCallback(
    async (sourceIndex, targetIndex) => {
      const reordered = [...questions]

      // Remove the element from its original position
      const [removedElement] = reordered.splice(sourceIndex, 1)

      // Insert the element at the target position
      reordered.splice(targetIndex, 0, removedElement)

      // Update the order properties for all elements
      reordered.forEach((item, index) => {
        item.order = index
      })

      setQuestions(reordered)

      await debounceSaveOrdering(reordered)
    },
    [debounceSaveOrdering, questions, setQuestions],
  )

  const getIndicator = useCallback(
    (questionId) => {
      const warnings = complianceCheck(composition)
      const warningMessage = warnings[questionId]
      if (warningMessage) {
        return (
          <UserHelpPopper mode={'warning'}>{warningMessage}</UserHelpPopper>
        )
      }
      return null
    },
    [composition],
  )

  return (
    <ReorderableList disabled={readOnly} onChangeOrder={onChangeOrder}>
      {questions.map((eToQ, index) => (
        <QuestionItem
          key={eToQ.id}
          groupScope={groupScope}
          evaluationToQuestion={eToQ}
          readOnly={readOnly}
          indicator={getIndicator(eToQ.question.id)}
          onChange={(index, updated) => {
            onCompositionChanged()
          }}
          onDelete={() => {
            onCompositionChanged()
          }}
        />
      ))}
    </ReorderableList>
  )
}

const QuestionItem = ({
  groupScope,
  evaluationToQuestion,
  indicator,
  onChange,
  onDelete,
  readOnly = false,
}) => {
  const router = useRouter()

  const deleteCollectionToQuestion = useCallback(
    async (toDelete) => {
      if (readOnly) return // prevent deletion in read-only mode

      await fetch(
        `/api/${groupScope}/evaluations/${toDelete.evaluationId}/composition`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questionId: toDelete.questionId,
          }),
        },
      )
    },
    [groupScope, readOnly],
  )

  const saveCollectionToQuestion = useCallback(
    async (index, updated) => {
      if (readOnly) return // prevent saving in read-only mode

      const response = await fetch(
        `/api/${groupScope}/evaluations/${updated.evaluationId}/composition`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            evaluationToQuestion: updated,
          }),
        },
      )
      if (response.ok) {
        onChange && onChange(index, updated)
      }
    },
    [groupScope, onChange, readOnly],
  )

  const debounceSaveCollectionToQuestion = useDebouncedCallback(
    saveCollectionToQuestion,
    300,
  )

  const theme = useTheme()

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      height={50}
      pl={1}
      borderBottom={`1px solid ${theme.palette.divider}`}
    >
      {!readOnly && (
        <Stack justifyContent={'center'} sx={{ cursor: 'move' }}>
          <DragHandleSVG />
        </Stack>
      )}
      <QuestionTypeIcon type={evaluationToQuestion.question.type} size={22} />
      <Stack
        direction={'row'}
        alignItems={'center'}
        spacing={1}
        flexGrow={1}
        overflow={'hidden'}
        whiteSpace={'nowrap'}
      >
        <Typography variant="body1">
          <b>Q{evaluationToQuestion.order + 1}</b>
        </Typography>
        <Typography variant="body2">
          {evaluationToQuestion.question.title}
        </Typography>
      </Stack>
      {indicator && indicator}

      <Stack
        minWidth={100}
        width={100}
        justifyContent={'flex-end'}
        direction={'row'}
        spacing={1}
        alignItems={'center'}
      >
        {readOnly ? (
          <Typography variant="body2">
            {evaluationToQuestion.points} pts
          </Typography>
        ) : (
          <>
            <Tooltip title="Update in new page">
              <IconButton
                onClick={async (ev) => {
                  ev.preventDefault()
                  ev.stopPropagation()
                  const currentPath = router.asPath // Capture current relative URL
                  await router.push(
                    `/${groupScope}/questions/${evaluationToQuestion?.question.id}?from=${encodeURIComponent(currentPath)}`,
                  )
                }}
              >
                <Image
                  alt="Update in new page"
                  src="/svg/icons/update.svg"
                  width={16}
                  height={16}
                />
              </IconButton>
            </Tooltip>
            <DecimalInput
              value={evaluationToQuestion.points}
              variant="standard"
              rightAdornement={'pts'}
              onChange={async (value) => {
                await debounceSaveCollectionToQuestion(
                  evaluationToQuestion.order,
                  {
                    ...evaluationToQuestion,
                    points: value,
                  },
                )
              }}
            />
          </>
        )}
      </Stack>
      {!readOnly && (
        <Tooltip title="Remove from collection">
          <IconButton
            key="delete-collection"
            onClick={async (ev) => {
              ev.preventDefault()
              ev.stopPropagation()
              await deleteCollectionToQuestion(evaluationToQuestion)
              onDelete && onDelete()
            }}
          >
            <Image
              alt="Remove From Collection"
              src="/svg/icons/cross.svg"
              width="24"
              height="24"
            />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  )
}

export default EvaluationComposition
