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
import { useCallback, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import Authorization from '../../security/Authorization'
import Loading from '../../feedback/Loading'
import { EvaluationPhase, Role, StudentAnswerStatus } from '@prisma/client'
import { fetcher } from '../../../code/utils'
import LayoutMain from '../../layout/LayoutMain'
import { Stack, Typography } from '@mui/material'
import Paging from '../../layout/utils/Paging'
import LayoutSplitScreen from '../../layout/LayoutSplitScreen'
import QuestionView from '../../question/QuestionView'
import BackButton from '../../layout/BackButton'
import UserAvatar from '../../layout/UserAvatar'
import AnswerCompare from '../../answer/AnswerCompare'
import GradingSignOff from '../grading/GradingSignOff'
import { saveGrading } from '../grading/utils'
import { useDebouncedCallback } from 'use-debounce'
import Addendum from '../addendum/Addendum'

const getFilledStatus = (studentAnswerStatus) => {
  switch (studentAnswerStatus) {
    case StudentAnswerStatus.MISSING:
      return 'empty'
    case StudentAnswerStatus.IN_PROGRESS:
      return 'half'
    case StudentAnswerStatus.SUBMITTED:
      return 'filled'
    default:
      return 'empty'
  }
}

const PageProfConsult = () => {
  const router = useRouter()
  const { groupScope, evaluationId, userEmail, questionPage } = router.query

  const {
    data: evaluation,
    error,
    mutate,
  } = useSWR(
    `/api/${groupScope}/evaluations/${evaluationId}/consult/${userEmail}`,
    groupScope && evaluationId && userEmail ? fetcher : null,
    { revalidateOnFocus: true, refreshInterval: 5000 },
  )
  const [evaluationToQuestions, setEvaluationToQuestions] = useState([])
  const [selected, setSelected] = useState()

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (
      evaluation &&
      evaluation.evaluationToQuestions &&
      evaluation.evaluationToQuestions.length > 0
    ) {
      setEvaluationToQuestions(evaluation.evaluationToQuestions)
      setSelected(evaluation.evaluationToQuestions[questionPage - 1])
    }
  }, [evaluation, questionPage])

  useEffect(() => {
    if (evaluationToQuestions && evaluationToQuestions.length > 0) {
      setSelected(evaluationToQuestions[questionPage - 1])
    }
  }, [questionPage, evaluationToQuestions])

  const questionPages = useMemo(
    () =>
      evaluationToQuestions.map((jstq) => ({
        id: jstq.question.id,
        label: `Q${jstq.order + 1}`,
        tooltip: `${jstq.title || jstq.question.title} - ${jstq.points} points`,
        fillable: true,
        state: getFilledStatus(jstq.question.studentAnswer[0].status),
      })),
    [evaluationToQuestions],
  )

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
    async (grading) => {
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

  const isDataReady = useMemo(
    () =>
      evaluationToQuestions.length > 0 &&
      selected &&
      selected.question.studentAnswer[0],
    [evaluationToQuestions, selected],
  )

  const onAddendumChanged = useCallback(
    (value) => {
      setEvaluationToQuestions(
        evaluationToQuestions.map((q) => {
          if (q.questionId === selected.questionId) {
            return { ...q, addendum: value }
          }
          return q
        }),
      )
    },
    [evaluationToQuestions, selected],
  )

  const readOnly = evaluation?.phase === EvaluationPhase.IN_PROGRESS

  const student = useMemo(
    () => selected?.question.studentAnswer[0].user,
    [selected],
  )
  const solution = useMemo(
    () => selected?.question[selected?.question.type],
    [selected],
  )

  const studentAnswer = useMemo(
    () => selected?.question.studentAnswer[0][selected?.question.type],
    [selected],
  )

  return (
    <Authorization allowRoles={[Role.PROFESSOR]}>
      <Loading loading={!evaluation} error={[error]}>
        {isDataReady && (
          <LayoutMain
            hideLogo
            header={
              <Stack direction="row" alignItems="center">
                <BackButton
                  backUrl={`/${groupScope}/evaluations/${evaluationId}`}
                />
                {selected && (
                  <UserAvatar user={selected.question.studentAnswer[0].user} />
                )}
                <Stack flex={1} sx={{ overflow: 'hidden' }}>
                  <Paging
                    items={questionPages}
                    active={selected?.question}
                    link={(_, questionIndex) =>
                      `/${groupScope}/evaluations/${evaluationId}/consult/${userEmail}/${
                        questionIndex + 1
                      }`
                    }
                  />
                </Stack>
              </Stack>
            }
          >
            <LayoutSplitScreen
              leftPanel={
                selected && (
                  <QuestionView
                    title={
                      <Typography variant="h6">{selected.title}</Typography>
                    }
                    order={selected.order}
                    points={selected.points}
                    question={selected.question}
                    totalPages={evaluationToQuestions.length}
                    above={
                      <Addendum
                        groupScope={groupScope}
                        evaluationId={evaluationId}
                        evaluationToQuestion={selected}
                        onAddendumChanged={onAddendumChanged}
                      />
                    }
                  />
                )
              }
              rightWidth={65}
              rightPanel={
                selected && (
                  <Stack height={'100%'}>
                    <AnswerCompare
                      id={`answer-viewer-${selected.question.id}`}
                      readOnly={readOnly}
                      student={student}
                      evaluationToQuestion={selected}
                      solution={solution}
                      answer={studentAnswer}
                    />
                  </Stack>
                )
              }
              footer={
                isDataReady &&
                !readOnly && (
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    height="100px"
                  >
                    <GradingSignOff
                      loading={loading}
                      answer={selected.question.studentAnswer.find(
                        (ans) => ans.user.email === userEmail,
                      )}
                      maxPoints={selected.points}
                      maxGradingPoints={selected.gradingPoints}
                      onChange={onChangeGrading}
                    />
                  </Stack>
                )
              }
            />
          </LayoutMain>
        )}
      </Loading>
    </Authorization>
  )
}

export default PageProfConsult
