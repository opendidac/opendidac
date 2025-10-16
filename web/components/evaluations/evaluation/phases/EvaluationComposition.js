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
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useDebouncedCallback } from 'use-debounce'
import {
  Alert,
  AlertTitle,
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
import CheckboxLabel from '@/components/input/CheckboxLabel'
import UserHelpPopper from '@/components/feedback/UserHelpPopper'
import { useSnackbar } from '@/context/SnackbarContext'
import DialogFeedback from '@/components/feedback/DialogFeedback'

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
      onCompositionChanged && onCompositionChanged()
    },
    [groupScope, evaluationId, onCompositionChanged],
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
        <CompositionGrid
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
          saveIncludeQuestions(questionIds)
        }}
        onClose={() => {
          setShowIncludeDrawer(false)
        }}
      />
    </Stack>
  )
}

const CompositionGrid = ({
  groupScope,
  evaluationId,
  composition,
  readOnly,
  onCompositionChanged,
}) => {
  const [questions, setQuestions] = useCtrlState(
    composition,
    `${evaluationId}-composition`,
  )

  const { show: showSnackbar } = useSnackbar()

  const { hasWarnings, globalWarnings, getIndicator } =
    useCompositionCompliance(questions)

  useEffect(() => {
    setQuestions(composition)
  }, [composition, setQuestions])

  const saveReOrder = useCallback(
    async (ordered) => {
      // Send only id + order (see Fix #2)
      try {
        await fetch(
          `/api/${groupScope}/evaluations/${evaluationId}/composition/order`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questions: ordered }),
          },
        )
        showSnackbar('Order saved', 'success')
      } catch (err) {
        showSnackbar(`Error while saving`, 'error')
      }
      onCompositionChanged && onCompositionChanged()
    },
    [onCompositionChanged, groupScope, evaluationId, showSnackbar],
  )

  // Optimistic updates to the questions state before the API call

  const onChangeOrder = useCallback(
    (sourceIndex, targetIndex) => {
      setQuestions((prev) => {
        const next = [...prev]
        const [moved] = next.splice(sourceIndex, 1)
        next.splice(targetIndex, 0, moved)
        const nextAfter = next.map((q, i) => ({ ...q, order: i }))
        return nextAfter
      })
    },
    [setQuestions],
  )

  const onChangeCompositionItem = useCallback(
    (questionid, property, value) => {
      setQuestions((prev) => {
        const next = [...prev]
        const index = next.findIndex((q) => q.questionId === questionid)
        next[index][property] = value
        return next
      })
    },
    [setQuestions],
  )

  const onDeleteCompositionItem = useCallback(
    (questionid) => {
      setQuestions((prev) => {
        return prev.filter((q) => q.questionId !== questionid)
      })
    },
    [setQuestions],
  )

  const hasNonOneCoef = useMemo(() => {
    return questions.some((q) => q.points !== q.gradingPoints)
  }, [questions])
  const [useCoefs, setUseCoefs] = useState(hasNonOneCoef)

  const [showConfirmNoCoefs, setShowConfirmNoCoefs] = useState(false)

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
          <CompositionItem
            key={eToQ.id}
            groupScope={groupScope}
            evaluationToQuestion={eToQ}
            readOnly={readOnly}
            indicator={getIndicator(eToQ.question.id)}
            onHandleDragEnd={async () => {
              await saveReOrder(questions)
            }}
            showCoef={useCoefs}
            onChangeCompositionItem={onChangeCompositionItem}
            onDeleteCompositionItem={onDeleteCompositionItem}
            onCompositionChanged={onCompositionChanged}
          />
        ))}
      </ReorderableList>
      <Stack flex={1} justifyContent={'right'} direction={'row'}>
        <CheckboxLabel
          label={'Use Coefficients'}
          disabled={readOnly}
          checked={useCoefs}
          onChange={(checked) => {
            if (!checked && hasNonOneCoef) {
              console.log(hasNonOneCoef)
              setShowConfirmNoCoefs(true)
            } else {
              setUseCoefs(checked)
            }
          }}
        />
        <UserHelpPopper>
          <Alert severity="info">
            <AlertTitle>Using Coefficients</AlertTitle>
            <Stack gap={1}>
              <Typography variant="body2">
                When toggled, you can specify a coefficient that will be applied
                to the number of points out of which the question will be
                graded. This lets you decouple the grading scale of a question
                from its weight in the evaluation.
              </Typography>
              <Typography variant="body2">
                For example, a question might be graded out of 5 points, but
                should contribute only 3 points to the evaluation. In this case,
                you can specify that the grading points are 5, and the
                coefficient is 0.6 (3/5), resulting in the weighted points of 3.
              </Typography>
            </Stack>
          </Alert>
        </UserHelpPopper>
        <DialogFeedback
          open={showConfirmNoCoefs}
          title={'Disable Coefficients?'}
          content={
            <Typography>
              You will lose any coefficients you have set on questions. Are you
              sure you want to proceed?
            </Typography>
          }
          onClose={() => setShowConfirmNoCoefs(false)}
          onConfirm={() => {
            setShowConfirmNoCoefs(false)
            setUseCoefs(false)
          }}
        />
      </Stack>
    </Stack>
  )
}

const CompositionItem = ({
  groupScope,
  evaluationToQuestion,
  indicator,
  onHandleDragEnd,
  readOnly = false,
  disabled = false,
  showCoef,
  onChangeCompositionItem,
  onDeleteCompositionItem,
  onCompositionChanged,
}) => {
  const router = useRouter()
  const {
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    disabled: dragDisabled,
    getDragStyles,
  } = useReorderable()

  const { show: showSnackbar } = useSnackbar()

  const theme = useTheme()

  const questionId = evaluationToQuestion.questionId
  const evaluationId = evaluationToQuestion.evaluationId
  const order = evaluationToQuestion.order
  const originalTitle = evaluationToQuestion.question.title
  const title = evaluationToQuestion.title

  const key = `${evaluationId}-${questionId}`

  const [points, setPoints] = useCtrlState(evaluationToQuestion.points, key)
  const [gradingPts, setGradingPts] = useCtrlState(
    evaluationToQuestion.gradingPoints,
    key,
  )
  const [coef, setCoef] = useCtrlState(
    gradingPts > 0 ? points / gradingPts : 0,
    key,
  )

  const saveCompositionItem = useCallback(
    (questionId, property, value) => {
      fetch(
        `/api/${groupScope}/evaluations/${evaluationId}/composition/${questionId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            [property]: value,
          }),
        },
      )
        .then((value) => {
          if (!value.ok) {
            throw new Error(
              `Error while saving details: ${value.status} ${value.statusText}`,
            )
          } else {
            showSnackbar(`Saved successfully`, 'success')
          }
        })
        .catch((err) => {
          console.error(err)
          showSnackbar(`Error while saving`, 'error')
        })
      onCompositionChanged && onCompositionChanged()
    },
    [evaluationId, groupScope, onCompositionChanged, showSnackbar],
  )

  const saveDelete = useCallback(
    async (evalId, qId) => {
      // persist deletion
      await fetch(
        `/api/${groupScope}/evaluations/${evalId}/composition/${qId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
      onCompositionChanged && onCompositionChanged()
    },
    [groupScope, onCompositionChanged],
  )

  const debounceSaveTitle = useDebouncedCallback(
    (questionId, newTitle) =>
      saveCompositionItem(questionId, 'title', newTitle),
    1000,
  )

  const debounceSavePoints = useDebouncedCallback(
    (questionId, newPoints) =>
      saveCompositionItem(questionId, 'points', newPoints),
    1000,
  )

  const debounceSaveGradingPts = useDebouncedCallback(
    (questionId, newGradingPts) =>
      saveCompositionItem(questionId, 'gradingPoints', newGradingPts),
    1000,
  )

  const onPointsChange = useCallback(
    (questionId, newGradingPoints, newPoints) => {
      if (newPoints !== points) {
        newPoints = Math.round(newPoints * 100) / 100
        setPoints(newPoints)
        onChangeCompositionItem(questionId, 'points', newPoints)
        debounceSavePoints(questionId, newPoints)
      }
      const newCoef = newGradingPoints === 0 ? 0 : newPoints / newGradingPoints
      if (newCoef !== coef) {
        setCoef(newCoef)
      }
      if (newGradingPoints !== gradingPts) {
        newGradingPoints = Math.round(newGradingPoints * 100) / 100
        setGradingPts(newGradingPoints)
        onChangeCompositionItem(questionId, 'gradingPoints', newGradingPoints)
        debounceSaveGradingPts(questionId, newGradingPoints)
      }
    },
    [
      coef,
      debounceSavePoints,
      debounceSaveGradingPts,
      onChangeCompositionItem,
      points,
      setCoef,
      setPoints,
      setGradingPts,
      gradingPts,
    ],
  )

  useEffect(() => {
    if (!showCoef) {
      onPointsChange(questionId, gradingPts, gradingPts)
    }
  }, [onPointsChange, gradingPts, questionId, showCoef])

  const handleDelete = useCallback(
    async (evalId, qId) => {
      onDeleteCompositionItem && onDeleteCompositionItem(qId)
      await saveDelete(evalId, qId)
    },
    [saveDelete, onDeleteCompositionItem],
  )

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      spacing={1}
      height={60}
      pl={1}
      borderBottom={`1px solid ${theme.palette.divider}`}
      sx={getDragStyles(order)}
      onDragOver={(e) => {
        if (readOnly || disabled) return
        handleDragOver(e, order)
      }}
      onDragEnd={(e) => {
        if (readOnly || disabled) return
        handleDragEnd(e, order)
        onHandleDragEnd && onHandleDragEnd()
      }}
    >
      {!readOnly && (
        <Stack
          justifyContent={'center'}
          sx={{
            opacity: disabled ? 0.5 : 1,
            cursor: dragDisabled ? 'not-allowed' : 'grab',
            '&:active': {
              cursor: 'grabbing',
            },
          }}
          pr={1}
          draggable={!dragDisabled}
          onDragStart={(e) => {
            // cancel the eventual debounced save
            handleDragStart(e, order)
          }}
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
          <b>Q{order + 1}</b>
        </Typography>
        <QuestionTitleField
          id={`${key}-title`}
          currentTitle={title}
          originalTitle={originalTitle}
          readOnly={readOnly || disabled}
          onChangeTitle={(title) => {
            onChangeCompositionItem(questionId, 'title', title)
            debounceSaveTitle(questionId, title)
          }}
        />
      </Stack>
      {indicator && indicator}

      <Stack
        justifyContent={'flex-end'}
        direction={'row'}
        spacing={1}
        alignItems={'center'}
      >
        {readOnly ? (
          <Typography variant="body2">
            {evaluationToQuestion.gradingPoints} grading pts &times;{' '}
            {Math.round(coef * 100) / 100} ={' '}
            {evaluationToQuestion.points} pts
          </Typography>
        ) : (
          <>
            <Tooltip title="Update in new page">
              <IconButton
                disabled={readOnly || disabled}
                onClick={async (ev) => {
                  ev.preventDefault()
                  ev.stopPropagation()
                  if (readOnly || disabled) return
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
            <Stack width={showCoef ? 100 : 60}>
              <DecimalInput
                value={gradingPts}
                variant="standard"
                rightAdornement={`${showCoef ? 'grading ' : ''}pts`}
                onChange={async (value) => {
                  if (readOnly || disabled) return
                  const newPoints = value * coef
                  onPointsChange(questionId, value, newPoints)
                }}
              />
            </Stack>
            {showCoef && (
              <>
                <Typography>&times;</Typography>
                <Stack width={60} direction={'row'}>
                  <DecimalInput
                    value={coef}
                    variant="standard"
                    rightAdornement={'coef'}
                    onChange={async (value) => {
                      if (readOnly || disabled) return
                      const newPoints = gradingPts * value
                      onPointsChange(questionId, gradingPts, newPoints)
                    }}
                  />
                </Stack>
                <Typography>=</Typography>
                <Stack width={60} direction={'row'}>
                  <DecimalInput
                    value={points}
                    variant="standard"
                    rightAdornement={'pts'}
                    disabled={points === 0}
                    onChange={async (value) => {
                      if (readOnly || disabled) return
                      onPointsChange(questionId, gradingPts, value)
                    }}
                  />
                </Stack>
              </>
            )}
          </>
        )}
      </Stack>
      {!(readOnly || disabled) && (
        <Tooltip title="Remove from collection">
          <IconButton
            key="delete-collection"
            onClick={async (ev) => {
              ev.preventDefault()
              ev.stopPropagation()
              await handleDelete(evaluationId, questionId)
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
