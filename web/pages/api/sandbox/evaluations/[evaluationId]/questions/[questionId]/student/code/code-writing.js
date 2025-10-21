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
import { EvaluationPhase, Role, UserOnEvaluationStatus } from '@prisma/client'
import { runSandbox } from '@/sandbox/runSandboxTC'
import { grading } from '@/code/grading/engine'
import {
  withAuthorization,
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { withPrisma } from '@/middleware/withPrisma'
import {
  withEvaluationPhase,
  withStudentStatus,
} from '@/middleware/withStudentEvaluation'
import { getUser } from '@/code/auth/auth'

/*
 endpoint to run the code sandbox for a users (generally students) answers
 Only uses files stored in the database
 */
const post = withEvaluationPhase(
  [EvaluationPhase.IN_PROGRESS],
  withStudentStatus(
    [UserOnEvaluationStatus.IN_PROGRESS],
    async (req, res, prisma) => {
      const user = await getUser(req, res)

      const { evaluationId, questionId } = req.query

      const code = await prisma.code.findUnique({
        where: {
          questionId: questionId,
        },
        include: {
          sandbox: true,
          codeWriting: {
            select: {
              testCases: {
                orderBy: {
                  index: 'asc',
                },
              },
              solutionFiles: true, // to get the hidden files
            },
          },
        },
      })

      if (!code) {
        res.status(404).json({ message: 'Code not found' })
        return
      }

      const studentAnswerCodeFiles = await prisma.studentAnswerCode.findUnique({
        where: {
          userEmail_questionId: {
            userEmail: user.email,
            questionId: questionId,
          },
        },
        include: {
          codeWriting: {
            select: {
              files: {
                include: {
                  file: true,
                },
              },
            },
          },
        },
      })

      if (
        !studentAnswerCodeFiles ||
        !studentAnswerCodeFiles.codeWriting.files
      ) {
        res.status(404).json({ message: 'Student files not found' })
        return
      }

      const image = code.sandbox.image
      const beforeAll = code.sandbox.beforeAll
      const files = studentAnswerCodeFiles.codeWriting.files.map(
        (codeToFile) => codeToFile.file,
      )
      const tests = code.codeWriting.testCases

      await runSandbox({
        image: image,
        beforeAll: beforeAll,
        files: files,
        tests: tests,
      })
        .then(async (response) => {
          // update the status of the users answers
          const studentAnswer = await prisma.StudentAnswerCodeWriting.update({
            where: {
              userEmail_questionId: {
                userEmail: user.email,
                questionId: questionId,
              },
            },
            data: {
              allTestCasesPassed: response.tests.every((test) => test.passed),
              testCaseResults: {
                deleteMany: {},
                create: response.tests.map((test, index) => ({
                  index: index + 1,
                  exec: test.exec,
                  input: test.input,
                  output: test.output,
                  expectedOutput: test.expectedOutput,
                  passed: test.passed,
                })),
              },
            },
          })

          const evaluationToQuestion =
            await prisma.evaluationToQuestion.findUnique({
              where: {
                evaluationId_questionId: {
                  evaluationId: evaluationId,
                  questionId: questionId,
                },
              },
              include: {
                question: {
                  include: {
                    code: true,
                  },
                },
              },
            })

          // code questions grading
          await prisma.studentQuestionGrading.upsert({
            where: {
              userEmail_questionId: {
                userEmail: user.email,
                questionId: questionId,
              },
            },
            update: grading(
              evaluationToQuestion.question,
              evaluationToQuestion.points,
              studentAnswer,
            ),
            create: {
              userEmail: user.email,
              questionId: questionId,
              ...grading(
                evaluationToQuestion.question,
                evaluationToQuestion.points,
                studentAnswer,
              ),
            },
          })

          res.status(200).send(response)
        })
        .catch((error) => {
          console.log(error)
          res.status(500).json({ message: 'Internal server error' })
        })
    },
  ),
)

export default withMethodHandler({
  POST: withAuthorization(withPrisma(post), [Role.PROFESSOR, Role.STUDENT]),
})
