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
import { useCallback, useEffect, useState, useMemo } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/router'
import {
  StudentQuestionGradingStatus,
  EvaluationPhase,
  Role,
} from '@prisma/client'

import {
  Stack,
  Divider,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Box,
} from '@mui/material'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import { LoadingButton } from '@mui/lab'
import { useSession } from 'next-auth/react'
import { useDebouncedCallback } from 'use-debounce'

import DialogFeedback from '@/components/feedback/DialogFeedback'
import PiePercent from '@/components/feedback/PiePercent'
import { fetcher } from '@/code/utils'

import LayoutMain from '@/components/layout/LayoutMain'
import BackButton from '@/components/layout/BackButton'
import Loading from '@/components/feedback/Loading'

import LayoutSplitScreen from '@/components/layout/LayoutSplitScreen'
import Paging from '@/components/layout/utils/Paging'
import MainMenu from '@/components/layout/MainMenu'
import Authorization from '@/components/security/Authorization'

import QuestionView from '@/components/question/QuestionView'
import AnswerCompare from '@/components/answer/AnswerCompare'

import { useSnackbar } from '@/context/SnackbarContext'

import { update } from './crud'

import { getGradingStats, getSignedSuccessRate } from '../analytics/stats'

import GradingSignOff from '../grading/GradingSignOff'
import ParticipantNav from '../grading/ParticipantNav'
import ResizableDrawer from '@/components/layout/utils/ResizableDrawer'
import StudentResultsGrid from '../evaluation/phases/results/StudentResultsGrid'
import ExportCSV from '../evaluation/phases/results/ExportCSV'
import { saveGrading } from '../grading/utils'

const PageGrading = () => {
  const router = useRouter()
  const { groupScope, evaluationId, participantId, activeQuestion } =
    router.query

  const { data: session } = useSession()
  const { show: showSnackbar } = useSnackbar()

  const { data: evaluation, error: errorEvaluation } = useSWR(
    `/api/${groupScope}/evaluations/${evaluationId}`,
    groupScope && evaluationId ? fetcher : null,
  )

  const {
    data,
    mutate,
    error: errorQuestions,
  } = useSWR(
    `/api/${groupScope}/evaluations/${evaluationId}/questions?withGradings=true`,
    groupScope && evaluationId ? fetcher : null,
    { revalidateOnFocus: false },
  )

  const [evaluationToQuestions, setEvaluationToQuestions] = useState([])
  const [participants, setParticipants] = useState([])

  const [evaluationToQuestion, setEvaluationEvaluationToQuestion] = useState()

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const [autoGradeSignOffDialogOpen, setAutoGradeSignOffDialogOpen] =
    useState(false)
  const [someUnsignedDialogOpen, setSomeUnsignedDialogOpen] = useState(false)
  const [studentGridOpen, setStudentGridOpen] = useState(false)

  useEffect(() => {
    if (data) {
      setEvaluationToQuestions(data)
    }
  }, [data])

  useEffect(() => {
    // 1) sedtup the participants list sorted by name
    if (!evaluationToQuestions || evaluationToQuestions.length === 0) return

    const participants = evaluationToQuestions[0].question.studentAnswer
      .map((sg) => sg.user)
      .sort((a, b) => a.name.localeCompare(b.name))

    setParticipants(participants)
  }, [evaluationToQuestions])

  useEffect(() => {
    // 2) setup the current active question and participant, redirect to the first participant if participantId is undefined
    if (
      !evaluationToQuestions ||
      evaluationToQuestions.length === 0 ||
      participants.length === 0
    )
      return

    const currentQuestion = evaluationToQuestions[activeQuestion - 1]
    setEvaluationEvaluationToQuestion(currentQuestion)

    // Redirect to the first participant if participantId is undefined
    if (!participantId) {
      router.push(
        `/${groupScope}/evaluations/${evaluationId}/grading/${activeQuestion}?participantId=${participants[0].id}`,
      )
    }
  }, [
    evaluationToQuestions,
    activeQuestion,
    participantId,
    participants,
    router,
    groupScope,
    evaluationId,
  ])

  const debouncedSaveGrading = useDebouncedCallback(
    useCallback(
      async (grading) => {
        setLoading(true)
        await saveGrading(groupScope, grading)
        setLoading(false)
      },
      [groupScope],
    ),
    500,
  )

  const onChangeGrading = useCallback(
    (grading) => {
      const newEvaluationToQuestions = [...evaluationToQuestions]
      const evaluationToQuestion = newEvaluationToQuestions.find(
        (jstq) => jstq.question.id === grading.questionId,
      )

      evaluationToQuestion.question.studentAnswer =
        evaluationToQuestion.question.studentAnswer.map((sa) => {
          if (sa.user.email === grading.userEmail) {
            return {
              ...sa,
              studentGrading: {
                ...sa.studentGrading,
                pointsObtained: grading.pointsObtained,
                status: grading.status,
                signedBy: grading.signedBy,
                signedByUserEmail: grading.signedBy
                  ? grading.signedBy.email
                  : null,
                comment: grading.comment,
              },
            }
          }
          return sa
        })
      setEvaluationToQuestions(newEvaluationToQuestions)
      debouncedSaveGrading(grading)
    },
    [evaluationToQuestions, debouncedSaveGrading],
  )

  const signOffAllAutograded = useCallback(async () => {
    let updated = []
    const newEvaluationToQuestions = [...evaluationToQuestions]
    for (const jstq of newEvaluationToQuestions) {
      for (const { studentGrading } of jstq.question.studentAnswer) {
        if (
          !studentGrading.signedBy &&
          studentGrading.status === StudentQuestionGradingStatus.AUTOGRADED
        ) {
          studentGrading.signedBy = session.user
          updated.push(studentGrading)
        }
      }
    }
    await Promise.all(
      updated.map((grading) => saveGrading(groupScope, grading)),
    )
    setEvaluationToQuestions(newEvaluationToQuestions)
    await mutate(newEvaluationToQuestions, false)
  }, [groupScope, evaluationToQuestions, mutate, session])

  const endGrading = useCallback(async () => {
    setSaving(true)
    await update(groupScope, evaluationId, {
      phase: EvaluationPhase.FINISHED,
    })
      .then(() => {
        router.push(`/${groupScope}/evaluations/${evaluationId}/finished`)
      })
      .catch(() => {
        showSnackbar('Error', 'error')
      })
    setSaving(false)
  }, [groupScope, evaluationId, router, showSnackbar])

  const nextParticipantOrQuestion = useCallback(async () => {
    let nextParticipantIndex =
      participants.findIndex((p) => p.id === participantId) + 1
    if (nextParticipantIndex < participants.length) {
      await router.push(
        `/${groupScope}/evaluations/${evaluationId}/grading/${activeQuestion}?participantId=${participants[nextParticipantIndex].id}`,
      )
    } else {
      if (activeQuestion < evaluationToQuestions.length) {
        await router.push(
          `/${groupScope}/evaluations/${evaluationId}/grading/${
            parseInt(activeQuestion) + 1
          }?participantId=${participants[0].id}`,
        )
      }
    }
  }, [
    groupScope,
    activeQuestion,
    evaluationId,
    participantId,
    participants,
    router,
    evaluationToQuestions,
  ])

  const prevParticipantOrQuestion = useCallback(() => {
    let prevParticipantIndex =
      participants.findIndex((p) => p.id === participantId) - 1
    if (prevParticipantIndex >= 0) {
      router.push(
        `/${groupScope}/evaluations/${evaluationId}/grading/${activeQuestion}?participantId=${participants[prevParticipantIndex].id}`,
      )
    } else {
      if (activeQuestion - 1 >= 1) {
        router.push(
          `/${groupScope}/evaluations/${evaluationId}/grading/${
            activeQuestion - 1
          }?participantId=${participants[participants.length - 1].id}`,
        )
      }
    }
  }, [
    groupScope,
    activeQuestion,
    evaluationId,
    participantId,
    participants,
    router,
  ])

  const gradingState = useCallback(
    (questionId) => {
      const jstq = evaluationToQuestions.find(
        (jstq) => jstq.question.id === questionId,
      )
      if (!jstq) {
        return 'empty'
      }

      const signedCount = jstq.question.studentAnswer.filter(
        (sa) => sa.studentGrading.signedBy,
      ).length

      if (signedCount === 0) {
        return 'empty'
      } else if (signedCount === jstq.question.studentAnswer.length) {
        return 'filled'
      } else {
        return 'half'
      }
    },
    [evaluationToQuestions],
  )

  const questionPages = useMemo(() => {
    return evaluationToQuestions.map((jstq) => ({
      id: jstq.question.id,
      label: `Q${jstq.order + 1}`,
      fillable: true,
      state: gradingState(jstq.question.id),
    }))
  }, [evaluationToQuestions, gradingState])

  const ready = useMemo(
    () =>
      evaluationToQuestions &&
      evaluationToQuestion &&
      participants &&
      participantId,
    [evaluationToQuestions, evaluationToQuestion, participants, participantId],
  )

  const student = useMemo(
    () => participants.find((p) => p.id === participantId),
    [participants, participantId],
  )

  const solution = useMemo(
    () => evaluationToQuestion?.question[evaluationToQuestion.question.type],
    [evaluationToQuestion],
  )

  const studentAnswer = useMemo(
    () =>
      ready &&
      evaluationToQuestion?.question.studentAnswer.find(
        (answer) => answer.user.id === participantId,
      )[evaluationToQuestion.question.type],
    [evaluationToQuestion, participantId, ready],
  )

  const isParticipantFilled = useCallback(
    (participant) => {
      return (
        ready &&
        evaluationToQuestion &&
        evaluationToQuestion.question.studentAnswer.find(
          (answer) => answer.user.id === participant.id,
        )?.studentGrading.signedBy
      )
    },
    [evaluationToQuestion, ready],
  )

  return (
    <Authorization allowRoles={[Role.PROFESSOR]}>
      <Loading
        errors={[errorEvaluation, errorQuestions]}
        loading={!evaluation || !data}
      >
        <LayoutMain
          hideLogo
          header={
            <Stack direction="row" alignItems="center">
              <BackButton
                backUrl={`/${groupScope}/evaluations/${evaluationId}`}
              />
              <Stack flex={1} sx={{ overflow: 'hidden' }}>
                {ready && (
                  <Paging
                    items={questionPages}
                    active={evaluationToQuestion.question}
                    link={(_, index) =>
                      `/${groupScope}/evaluations/${evaluationId}/grading/${
                        index + 1
                      }?participantId=${participantId}`
                    }
                  />
                )}
              </Stack>
            </Stack>
          }
          padding={0}
          spacing={2}
        >
          <LayoutSplitScreen
            header={<MainMenu />}
            leftPanel={
              <Stack
                direction="row"
                sx={{ position: 'relative', height: '100%' }}
              >
                {evaluationToQuestion && (
                  <QuestionView
                    order={evaluationToQuestion.order}
                    points={evaluationToQuestion.points}
                    question={evaluationToQuestion.question}
                    totalPages={evaluationToQuestions.length}
                  />
                )}
              </Stack>
            }
            rightWidth={75}
            rightPanel={
              <Stack
                direction="row"
                padding={1}
                position="relative"
                height="100%"
              >
                {ready && (
                  <>
                    <ParticipantNav
                      participants={participants}
                      active={participants.find(
                        (participant) => participant.id === participantId,
                      )}
                      onParticipantClick={(participant) => {
                        router.push(
                          `/${groupScope}/evaluations/${evaluationId}/grading/${activeQuestion}?participantId=${participant.id}`,
                        )
                      }}
                      isParticipantFilled={isParticipantFilled}
                    />
                    <Divider orientation="vertical" flexItem />
                    <AnswerCompare
                      student={student}
                      evaluationToQuestion={evaluationToQuestion}
                      solution={solution}
                      answer={studentAnswer}
                    />
                  </>
                )}
              </Stack>
            }
            footer={
              ready && (
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  height="100px"
                >
                  <GradingNextBack
                    isFirst={
                      participants.findIndex((p) => p.id === participantId) ===
                        0 && parseInt(activeQuestion) === 0
                    }
                    onPrev={prevParticipantOrQuestion}
                    onNext={nextParticipantOrQuestion}
                  />
                  <GradingSignOff
                    loading={loading}
                    answer={evaluationToQuestion.question.studentAnswer.find(
                      (ans) => ans.user.id === participantId,
                    )}
                    maxPoints={evaluationToQuestion.points}
                    onChange={onChangeGrading}
                  />

                  <SuccessRate
                    value={getSignedSuccessRate(evaluationToQuestions)}
                  />

                  <GradingActions
                    stats={getGradingStats(evaluationToQuestions)}
                    loading={loading || saving}
                    signOffAllAutograded={() =>
                      setAutoGradeSignOffDialogOpen(true)
                    }
                  />
                </Stack>
              )
            }
          />
        </LayoutMain>
        <DialogFeedback
          open={autoGradeSignOffDialogOpen}
          onClose={() => setAutoGradeSignOffDialogOpen(false)}
          title="Sign off all autograded"
          content={
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Its is recommended to control the autograded answers before
                signing them off.
              </Typography>
              <Typography variant="button" gutterBottom>
                Are you sure you want to sign off all autograded answers?
              </Typography>
            </>
          }
          onConfirm={signOffAllAutograded}
        />
        <DialogFeedback
          open={someUnsignedDialogOpen}
          onClose={() => setSomeUnsignedDialogOpen(false)}
          title="End grading"
          content={
            <Typography variant="body1" sx={{ mb: 2 }}>
              The signoff process is not complete.
            </Typography>
          }
        />
        <ResizableDrawer
          open={studentGridOpen}
          width={80}
          onClose={() => setStudentGridOpen(false)}
        >
          <Box ml={1}>
            <ExportCSV
              evaluation={evaluation}
              evaluationToQuestions={evaluationToQuestions}
              participants={participants}
            />
          </Box>
          <StudentResultsGrid
            evaluationToQuestions={evaluationToQuestions}
            selectedQuestionCell={{
              questionId: evaluationToQuestion?.question.id,
              participantId: participantId,
            }}
            questionCellClick={async (questionId, participantId) => {
              const questionOrder =
                evaluationToQuestions.findIndex(
                  (jstq) => jstq.question.id === questionId,
                ) + 1
              setStudentGridOpen(false)
              await router.push(
                `/${groupScope}/evaluations/${evaluationId}/grading/${questionOrder}?participantId=${participantId}`,
              )
            }}
          />
        </ResizableDrawer>
      </Loading>
    </Authorization>
  )
}

const GradingNextBack = ({ isFirst, onPrev, onNext }) => {
  const handleKeyDown = useCallback(
    (event) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'ArrowLeft') {
          if (!isFirst) onPrev()
        } else if (event.key === 'ArrowRight') {
          onNext()
        }
      }
    },
    [onPrev, onNext, isFirst],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return (
    <Paper>
      <Stack direction="row" justifyContent="space-between">
        <Tooltip title={`${navigator.userAgent.includes('Mac') ? '⌘' : 'CTRL'}+Left`}>
          <IconButton
            onClick={onPrev}
            disabled={isFirst}
            sx={{ width: 90, height: 90, borderRadius: 0, borderRight: 0 }}
          >
            <ArrowBackIosIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={`${navigator.userAgent.includes('Mac') ? '⌘' : 'CTRL'}+Right`}>
          <IconButton
            onClick={onNext}
            sx={{ width: 90, height: 90, borderRadius: 0, borderRight: 0 }}
          >
            <ArrowForwardIosIcon />
          </IconButton>
        </Tooltip>
      </Stack>
    </Paper>
  )
}

const SuccessRate = ({ value }) => {
  return (
    <Tooltip
      title={
        <>
          <Box>
            Overall success rate based on all <b>signed</b> gradings up to this
            point.
          </Box>
          <Box>
            (total of all awarded points / total of all possible points) * 100
          </Box>
        </>
      }
    >
      <Paper sx={{ p: 1 }}>
        <Stack alignItems="center" justifyContent="center" spacing={1}>
          <Typography variant="body2" sx={{ mr: 1 }}>
            Success Rate
          </Typography>
          <PiePercent value={value} />
        </Stack>
      </Paper>
    </Tooltip>
  )
}

const GradingActions = ({
  stats: { totalSigned, totalGradings, totalAutogradedUnsigned },
  loading,
  signOffAllAutograded,
}) => (
  <Tooltip
    title={
      totalSigned === totalGradings
        ? 'All gradings signed'
        : `You have ${totalGradings - totalSigned} gradings to sign off`
    }
  >
    <Paper sx={{ p: 1 }}>
      <Stack justifyContent="center" spacing={1} sx={{ height: '100%' }}>
        <Stack
          flexGrow={1}
          alignItems="start"
          justifyContent="space-between"
          direction="row"
        >
          <Stack direction="row" alignItems="center" sx={{ mr: 2 }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              Grading progress:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {totalSigned} / {totalGradings}
            </Typography>
          </Stack>
          {totalSigned < totalGradings && (
            <PiePercent
              size={39}
              value={Math.round((totalSigned / totalGradings) * 100)}
            />
          )}
        </Stack>
        {totalAutogradedUnsigned > 0 && (
          <LoadingButton
            loading={loading}
            size="small"
            onClick={signOffAllAutograded}
          >
            Sign off {totalAutogradedUnsigned} autograded unsigned
          </LoadingButton>
        )}
      </Stack>
    </Paper>
  </Tooltip>
)

export default PageGrading
