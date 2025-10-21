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

import { useEffect } from 'react'
import { Role } from '@prisma/client'
import { Box, Typography } from '@mui/material'

import { ResizeObserverProvider } from '@/context/ResizeObserverContext'
import Authorization from '@/components/security/Authorization'
import Loading from '@/components/feedback/Loading'
import LayoutMain from '@/components/layout/LayoutMain'
import LayoutSplitScreen from '@/components/layout/LayoutSplitScreen'
import ScrollContainer from '@/components/layout/ScrollContainer'
import AnswerEditor from '@/components/answer/AnswerEditor'

import QuestionView from '@/components/question/QuestionView'

import QuestionNav from './take/QuestionNav'
import StudentMainMenu from './take/StudentMainMenu'

import { useStudentOnEvaluation } from '@/context/StudentOnEvaluationContext'
import { useSnackbar } from '@/context/SnackbarContext'

const PageEvaluationTake = () => {
  const { showTopCenter: showSnackbar } = useSnackbar()

  const {
    evaluationId,
    evaluation,
    evaluationToQuestions,

    pages,
    page,
    activeQuestion,

    changeAnswer,
    submitAnswer,
    unsubmitAnswer,

    loaded,
    error,
  } = useStudentOnEvaluation()

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check if Ctrl + S is pressed
      if ((event.ctrlKey || event.metaKey) && event.keyCode === 83) {
        event.preventDefault() // Prevent the default browser save action
        showSnackbar('Your answers are saved automatically', 'success')
      }
    }

    document.addEventListener('keydown', handleKeyDown) // Attach the event listener

    return () => {
      document.removeEventListener('keydown', handleKeyDown) // Clean up the event listener
    }
  }, [showSnackbar])

  return (
    <Authorization allowRoles={[Role.PROFESSOR, Role.STUDENT]}>
      <Loading loading={!loaded} errors={[error]}>
        {loaded && (
          <LayoutMain
            header={
              <Loading
                loading={!loaded}
                errors={[error]}
                message={'Loading evaluation...'}
              >
                <StudentMainMenu
                  evaluationId={evaluationId}
                  evaluation={evaluation}
                  pages={pages}
                  page={page}
                />
              </Loading>
            }
          >
            <LayoutSplitScreen
              leftPanel={
                <>
                  <QuestionView
                    title={
                      <Typography variant="h6">
                        {activeQuestion?.title}
                      </Typography>
                    }
                    order={activeQuestion?.order}
                    points={activeQuestion?.points}
                    question={activeQuestion?.question}
                    page={page}
                    totalPages={pages.length - 1}
                  />
                  <QuestionNav
                    evaluationId={evaluationId}
                    page={page}
                    totalPages={pages.length}
                  />
                </>
              }
              rightPanel={evaluationToQuestions.map((q, index) => (
                <Box
                  key={q.question.id}
                  height="100%"
                  display={index === page - 1 ? 'block' : 'none'}
                >
                  <ResizeObserverProvider>
                    <ScrollContainer>
                      <AnswerEditor
                        questionId={q.question.id}
                        status={q.question.studentAnswer[0].status}
                        onAnswer={(question, updatedStudentAnswer) => {
                          changeAnswer(question.id, updatedStudentAnswer)
                        }}
                        onSubmit={(question) => {
                          submitAnswer(question.id)
                        }}
                        onUnsubmit={(question) => {
                          unsubmitAnswer(question.id)
                        }}
                      />
                    </ScrollContainer>
                  </ResizeObserverProvider>
                </Box>
              ))}
              rightWidth={70}
            />
          </LayoutMain>
        )}
      </Loading>
    </Authorization>
  )
}

export default PageEvaluationTake
