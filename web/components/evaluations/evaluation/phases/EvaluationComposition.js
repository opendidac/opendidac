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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useDebouncedCallback } from 'use-debounce'
import {
  Alert,
  AlertTitle,
  Box,
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
import CheckboxLabel from '@/components/input/CheckboxLabel'
import UserHelpPopper from '@/components/feedback/UserHelpPopper'
import { useSnackbar } from '@/context/SnackbarContext'
import DialogFeedback from '@/components/feedback/DialogFeedback'
import { computeCoefficient } from '@/core/grading/coefficient'
import { useCtrlState } from '@/hooks/useCtrlState'

// Edit modes for composition items:
// - 'full': all fields editable (COMPOSITION phase, not purged)
// - 'gradingOnly': only grading points editable (beyond COMPOSITION, not purged)
// - 'none': nothing editable (purged)
const EDIT_MODE = {
  FULL: 'full',
  GRADING_ONLY: 'gradingOnly',
  NONE: 'none',
}

const EvaluationComposition = ({
  groupScope,
  evaluation,
  composition,
  onCompositionChanged,
}) => {
  const evaluationId = evaluation.id

  const isPurged = Boolean(evaluation.purgedAt)
  const isBeyondComposition = phaseGreaterThan(
    evaluation.phase,
    EvaluationPhase.COMPOSITION,
  )

  const editMode = isPurged
    ? EDIT_MODE.NONE
    : isBeyondComposition
      ? EDIT_MODE.GRADING_ONLY
      : EDIT_MODE.FULL

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
            disabled={editMode !== EDIT_MODE.FULL}
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
          editMode={editMode}
          onCompositionChanged={onCompositionChanged}
        />
      </ScrollContainer>
      <QuestionIncludeDrawer
        open={showIncludeDrawer}
        groupScope={groupScope}
        includedQuestions={composition?.map((eq) => eq.question) ?? []}
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
  editMode,
  onCompositionChanged,
}) => {
  const canEditFully = editMode === EDIT_MODE.FULL
  const {
    renderedValue: questions,
    setValueControlled: setQuestions,
    getValue: getQuestions,
  } = useCtrlState(composition ?? [], `${evaluationId}-composition`)

  const { show: showSnackbar } = useSnackbar()

  const { hasWarnings, globalWarnings, getIndicator } =
    useCompositionCompliance(questions)

  useEffect(() => {
    const incoming = composition ?? []
    setQuestions((prev) => {
      if (!prev?.length) return incoming

      const prevByQuestionId = new Map(prev.map((q) => [q.questionId, q]))
      const incomingByQuestionId = new Map(
        incoming.map((q) => [q.questionId, q]),
      )

      // Keep local visual order while syncing fresh server objects.
      const locallyOrdered = prev
        .map((q) => incomingByQuestionId.get(q.questionId))
        .filter(Boolean)

      const locallyOrderedIds = new Set(locallyOrdered.map((q) => q.questionId))
      const newFromServer = incoming.filter(
        (q) => !locallyOrderedIds.has(q.questionId),
      )

      return [...locallyOrdered, ...newFromServer].map((serverQ, index) => {
        const localQ = prevByQuestionId.get(serverQ.questionId)
        return {
          ...serverQ,
          // Preserve in-flight local edits while debounced saves complete.
          title: localQ?.title ?? serverQ.title,
          points: localQ?.points ?? serverQ.points,
          gradingPoints: localQ?.gradingPoints ?? serverQ.gradingPoints,
          order: index,
        }
      })
    })
  }, [composition, setQuestions])

  const saveReOrder = useCallback(
    async (ordered) => {
      // Keep reorder isolated: persist only order fields.
      const orderOnly = ordered.map((question) => ({
        questionId: question.questionId,
        order: question.order,
      }))
      try {
        await fetch(
          `/api/${groupScope}/evaluations/${evaluationId}/composition/order`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questions: orderOnly }),
          },
        )
        showSnackbar('Order saved', 'success')
      } catch (err) {
        showSnackbar(`Error while saving`, 'error')
      }
    },
    [groupScope, evaluationId, showSnackbar],
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
        if (index < 0) return prev
        next[index] = {
          ...next[index],
          [property]: value,
        }
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
      <Stack direction="row">
        <Box flexGrow={1}>
          {canEditFully ? (
            <Alert severity="info">
              <Typography variant="body2">
                Once you move beyond this phase, the composition will be locked.
                At that stage, the full list of questions will be copied to the
                evaluation.
              </Typography>
            </Alert>
          ) : (
            <Alert severity="info">
              <Typography variant="body2">
                This evaluation is locked for composition. The full list of
                questions has been copied to the evaluation.
              </Typography>
            </Alert>
          )}
        </Box>
        <Stack
          flex={1}
          justifyContent={'right'}
          direction={'row'}
          alignItems="center"
        >
          <CheckboxLabel
            label={'Use Coefficients'}
            checked={useCoefs}
            onChange={(checked) => {
              if (!checked && hasNonOneCoef) {
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
                  When toggled, lets you specify a coefficient for each
                  question. It will be applied to the points awarded during
                  grading, to obtain the final points obtained on the question.
                </Typography>
                <Typography variant="body2">
                  For example, if a question is graded out of 5 points, but
                  should only contribute 3 points to the evaluation, you should
                  specify that the grading points are 5, and the coefficient is
                  0.6, resulting in the weighted points of 3.
                </Typography>
              </Stack>
            </Alert>
          </UserHelpPopper>
          <DialogFeedback
            open={showConfirmNoCoefs}
            title={'Disable Coefficients?'}
            content={
              <Typography>
                You will lose any coefficients you have set on questions. Are
                you sure you want to proceed?
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
      <ReorderableList disabled={!canEditFully} onChangeOrder={onChangeOrder}>
        {questions.map((eToQ) => (
          <CompositionItem
            key={eToQ.id}
            groupScope={groupScope}
            evaluationToQuestion={eToQ}
            editMode={editMode}
            indicator={getIndicator(eToQ.question.id)}
            onHandleDragEnd={async () => {
              await saveReOrder(getQuestions())
            }}
            showCoef={useCoefs}
            onChangeCompositionItem={onChangeCompositionItem}
            onDeleteCompositionItem={onDeleteCompositionItem}
            onCompositionChanged={onCompositionChanged}
          />
        ))}
      </ReorderableList>
    </Stack>
  )
}

const CompositionItem = ({
  groupScope,
  evaluationToQuestion,
  indicator,
  onHandleDragEnd,
  editMode,
  showCoef,
  onChangeCompositionItem,
  onDeleteCompositionItem,
  onCompositionChanged,
}) => {
  const canEditFully = editMode === EDIT_MODE.FULL
  const canEditGrading = editMode !== EDIT_MODE.NONE

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

  const { renderedValue: points, setValueControlled: setPoints } = useCtrlState(
    evaluationToQuestion.points,
    key,
  )

  const { renderedValue: gradingPts, setValueControlled: setGradingPts } =
    useCtrlState(evaluationToQuestion.gradingPoints, key)

  const saveCompositionItem = useCallback(
    async (questionId, property, value) => {
      try {
        const response = await fetch(
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
        if (!response.ok) {
          throw new Error(
            `Error while saving details: ${JSON.stringify(response)}`,
          )
        }
        showSnackbar(`Saved successfully`, 'success')
      } catch (err) {
        console.error(err)
        showSnackbar(`Error while saving`, 'error')
      }
    },
    [evaluationId, groupScope, showSnackbar],
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

  // Separate debouncers since it might ignore quick calls in succession.
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

  useEffect(() => {
    // Ensure pending debounced edits are persisted when leaving the row.
    return () => {
      debounceSaveTitle.flush()
      debounceSavePoints.flush()
      debounceSaveGradingPts.flush()
    }
  }, [debounceSaveTitle, debounceSavePoints, debounceSaveGradingPts])

  const onPointsChanged = useCallback(
    (newPoints, options = {}) => {
      const { syncGrading = false } = options
      if (canEditFully) {
        const roundedNewPoints = Math.round(newPoints * 100) / 100
        setPoints(roundedNewPoints)
        onChangeCompositionItem(questionId, 'points', roundedNewPoints)
        debounceSavePoints(questionId, roundedNewPoints)
        if (syncGrading) {
          setGradingPts(roundedNewPoints)
          onChangeCompositionItem(questionId, 'gradingPoints', roundedNewPoints)
          debounceSaveGradingPts(questionId, roundedNewPoints)
        }
      }
    },
    [
      debounceSavePoints,
      debounceSaveGradingPts,
      canEditFully,
      onChangeCompositionItem,
      questionId,
      setPoints,
      setGradingPts,
    ],
  )

  const persistGradingPoints = useCallback(
    (newGradingPoints) => {
      if (!canEditGrading) return
      const roundedGradingPoints = Math.round(newGradingPoints * 100) / 100
      setGradingPts(roundedGradingPoints)
      const allowedAfterComposition = !(
        roundedGradingPoints === 0 && points !== 0
      )
      if (canEditFully || allowedAfterComposition) {
        onChangeCompositionItem(
          questionId,
          'gradingPoints',
          roundedGradingPoints,
        )
        debounceSaveGradingPts(questionId, roundedGradingPoints)
      }
    },
    [
      setGradingPts,
      points,
      canEditFully,
      canEditGrading,
      onChangeCompositionItem,
      questionId,
      debounceSaveGradingPts,
    ],
  )

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
        if (!canEditFully) return
        handleDragOver(e, order)
      }}
      onDragEnd={(e) => {
        if (!canEditFully) return
        handleDragEnd(e, order)
        onHandleDragEnd && onHandleDragEnd()
      }}
    >
      {canEditFully && (
        <Stack
          justifyContent={'center'}
          sx={{
            cursor: dragDisabled ? 'not-allowed' : 'grab',
            '&:active': {
              cursor: 'grabbing',
            },
          }}
          pr={1}
          draggable={!dragDisabled}
          onDragStart={(e) => {
            // Persist pending edits before reordering.
            debounceSaveTitle.flush()
            debounceSavePoints.flush()
            debounceSaveGradingPts.flush()
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
          readOnly={!canEditFully}
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
        {canEditFully && (
          <>
            <Tooltip title="Update in new page">
              <IconButton
                disabled={!canEditFully}
                onClick={async (ev) => {
                  ev.preventDefault()
                  ev.stopPropagation()
                  if (!canEditFully) return
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
          </>
        )}

        {!showCoef &&
          (canEditFully ? (
            <Stack width={60}>
              <DecimalInput
                value={points}
                variant="standard"
                rightAdornement={'pts'}
                disabled={!canEditFully}
                onChange={(value) =>
                  onPointsChanged(value, { syncGrading: true })
                }
                onBlur={() => {
                  debounceSavePoints.flush()
                  debounceSaveGradingPts.flush()
                }}
              />
            </Stack>
          ) : (
            <Typography variant="body2">{points} pts</Typography>
          ))}
        <CoefficientEditor
          active={showCoef}
          canEditFully={canEditFully}
          canEditGrading={canEditGrading}
          points={points}
          gradingPts={gradingPts}
          onPointsChanged={onPointsChanged}
          onGradingPointsChanged={persistGradingPoints}
          onBlurPoints={() => debounceSavePoints.flush()}
          onBlurGradingPts={() => debounceSaveGradingPts.flush()}
        />
      </Stack>
      {canEditFully && (
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

const CoefficientEditor = ({
  active,
  canEditFully,
  canEditGrading,
  points,
  gradingPts,
  onPointsChanged,
  onGradingPointsChanged,
  onBlurPoints,
  onBlurGradingPts,
}) => {
  const coef = useMemo(
    () => computeCoefficient(gradingPts, points),
    [gradingPts, points],
  )
  const prevActiveRef = useRef(active)

  useEffect(() => {
    const switchedOffCoefs = prevActiveRef.current && !active
    if (switchedOffCoefs) {
      // Coefs off means effective coef=1, so keep points and grading aligned.
      if (canEditFully) {
        onPointsChanged(gradingPts, { syncGrading: true })
      } else if (canEditGrading) {
        onGradingPointsChanged(points)
      }
    }
    prevActiveRef.current = active
  }, [
    active,
    canEditFully,
    canEditGrading,
    gradingPts,
    points,
    onPointsChanged,
    onGradingPointsChanged,
  ])

  const onCoefChanged = useCallback(
    (newCoef) => {
      if (!canEditFully) return
      const newPoints = gradingPts * newCoef
      onPointsChanged(newPoints)
    },
    [canEditFully, gradingPts, onPointsChanged],
  )

  const onGradingPtsChanged = useCallback(
    (newGradingPoints) => {
      onGradingPointsChanged(newGradingPoints)
      if (canEditFully) {
        // In composition + coef mode, grading points drive weighted points.
        const roundedGradingPoints = Math.round(newGradingPoints * 100) / 100
        onPointsChanged(roundedGradingPoints * coef)
      }
    },
    [onGradingPointsChanged, canEditFully, onPointsChanged, coef],
  )

  if (!active) return null

  return (
    <>
      <Stack width={100}>
        <DecimalInput
          value={gradingPts}
          variant="standard"
          rightAdornement={'grading pts'}
          disabled={!canEditGrading}
          min={!canEditFully && points !== 0 ? 0.01 : 0}
          onChange={onGradingPtsChanged}
          onBlur={onBlurGradingPts}
        />
      </Stack>
      <Typography>&times;</Typography>
      <Tooltip
        disableHoverListener={canEditFully}
        disableTouchListener={canEditFully}
        disableFocusListener={canEditFully}
        enterDelay={500}
        title={
          'Coefficient and number of points cannot change after composition phase.'
        }
        key={'points-tooltip'}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Stack width={60} direction={'row'}>
            <DecimalInput
              value={coef}
              variant="standard"
              rightAdornement={'coef'}
              disabled={(gradingPts === 0 && points === 0) || !canEditFully}
              min={!canEditFully && points !== 0 ? 0.01 : 0}
              onChange={onCoefChanged}
            />
          </Stack>
          <Typography>=</Typography>
          <Stack width={60} direction={'row'}>
            <DecimalInput
              value={points}
              variant="standard"
              rightAdornement={'pts'}
              disabled={gradingPts === 0 || !canEditFully}
              onChange={onPointsChanged}
              onBlur={onBlurPoints}
            />
          </Stack>
        </Stack>
      </Tooltip>
    </>
  )
}

export default EvaluationComposition
