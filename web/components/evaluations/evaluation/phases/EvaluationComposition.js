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
import CodeQuestionTypeIcon from '@/components/question/type_specific/code/CodeQuestionTypeIcon'
import ScrollContainer from '@/components/layout/ScrollContainer'
import ReorderableList from '@/components/layout/utils/ReorderableList'
import { phaseGreaterThan } from '../phases'
import { EvaluationPhase, QuestionType } from '@prisma/client'
import QuestionIncludeDrawer from './composition/QuestionIncludeDrawer'
import QuestionTitleField from './composition/QuestionTitleField'
import { useTheme } from '@emotion/react'
import EvaluationTitleBar from '../layout/EvaluationTitleBar'
import { useRouter } from 'next/router'
import { useReorderable } from '@/components/layout/utils/ReorderableList'
import {
  ComplianceBanner,
  useCompositionCompliance,
} from './composition/CompositionCompliance'
import useCtrlState from '@/hooks/useCtrlState'

const EvaluationComposition = ({
  groupScope,
  evaluation,
  composition,
  onCompositionChanged,
}) => {
  const evaluationId = evaluation.id

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
      <ScrollContainer spacing={1} px={1} pb={24}>
        <EvaluationCompositionQuestions
          groupScope={groupScope}
          evaluationId={evaluationId}
          composition={composition}
          readOnly={readOnly}
          onCompositionChanged={onCompositionChanged}
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

const EvaluationCompositionQuestions = ({
  groupScope,
  evaluationId,
  composition,
  readOnly,
  onCompositionChanged,
}) => {
  const [questions, setQuestions] = useCtrlState(composition, evaluationId)
  const { hasWarnings, globalWarnings, getIndicator } =
    useCompositionCompliance(questions)

  useEffect(() => {
    setQuestions(composition)
  }, [composition, setQuestions])

  // Compliance computed by hook

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
      onCompositionChanged && onCompositionChanged()
    },
    [debounceSaveOrdering, questions, setQuestions, onCompositionChanged],
  )

  // getIndicator provided by hook

  return (
    <Stack spacing={1}>
      <ComplianceBanner
        hasWarnings={hasWarnings}
        globalWarnings={globalWarnings}
      />
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
      <ReorderableList disabled={readOnly} onChangeOrder={onChangeOrder}>
        {questions.map((eToQ) => (
          <QuestionItem
            key={eToQ.id}
            groupScope={groupScope}
            evaluationToQuestion={eToQ}
            readOnly={readOnly}
            indicator={getIndicator(eToQ.question.id)}
            onUpdate={() => onCompositionChanged()}
            onDelete={() => onCompositionChanged()}
          />
        ))}
      </ReorderableList>
    </Stack>
  )
}

const QuestionItem = ({
  groupScope,
  evaluationToQuestion,
  indicator,
  onUpdate,
  onDelete,
  readOnly = false,
}) => {
  const router = useRouter()
  const {
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    disabled,
    getDragStyles,
  } = useReorderable()

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
    async (updated) => {
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
        onUpdate && onUpdate()
      }
    },
    [groupScope, onUpdate, readOnly],
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
      justifyContent="center"
      spacing={1}
      height={60}
      pl={1}
      borderBottom={`1px solid ${theme.palette.divider}`}
      sx={getDragStyles(evaluationToQuestion.order)}
      onDragOver={(e) => handleDragOver(e, evaluationToQuestion.order)}
      onDragEnd={(e) => handleDragEnd(e, evaluationToQuestion.order)}
    >
      {!readOnly && (
        <Stack
          justifyContent={'center'}
          sx={{
            cursor: disabled ? 'not-allowed' : 'grab',
            '&:active': {
              cursor: 'grabbing',
            },
          }}
          draggable={!disabled}
          onDragStart={(e) => handleDragStart(e, evaluationToQuestion.order)}
        >
          <DragHandleSVG />
        </Stack>
      )}
      <QuestionTypeIcon type={evaluationToQuestion.question.type} size={32} />
      {evaluationToQuestion.question.type === QuestionType.code && (
        <CodeQuestionTypeIcon
          codeType={evaluationToQuestion.question.code?.codeType}
          size={20}
        />
      )}
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
        <QuestionTitleField
          id={evaluationToQuestion.questionId}
          evaluationToQuestion={evaluationToQuestion}
          readOnly={readOnly}
          onSave={async (updatedEvaluationToQuestion) => {
            evaluationToQuestion.title = updatedEvaluationToQuestion.title
            await debounceSaveCollectionToQuestion(updatedEvaluationToQuestion)
          }}
        />
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
                evaluationToQuestion.points = value
                await debounceSaveCollectionToQuestion({
                  ...evaluationToQuestion,
                  points: value,
                })
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
