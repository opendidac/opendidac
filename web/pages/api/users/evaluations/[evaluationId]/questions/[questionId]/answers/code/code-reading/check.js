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

import {
  EvaluationPhase,
  Role,
  StudentAnswerCodeReadingOutputStatus,
  UserOnEvaluationStatus,
} from '@prisma/client'
import { withPrisma } from '@/middleware/withPrisma'
import {
  withAuthorization,
  withMethodHandler,
} from '@/middleware/withAuthorization'
import {
  withEvaluationPhase,
  withStudentStatus,
} from '@/middleware/withStudentEvaluation'
import { getUser } from '@/code/auth/auth'
/*
  Student checked his answer to a code reading snippet during an evaluation

*/
const post = withEvaluationPhase(
  [EvaluationPhase.IN_PROGRESS],
  withStudentStatus(
    [UserOnEvaluationStatus.IN_PROGRESS],
    async (req, res, prisma) => {
      const user = await getUser(req, res)
      const studentEmail = user.email
      const { evaluationId, questionId } = req.query

      const evaluationToQuestion = await prisma.evaluationToQuestion.findUnique(
        {
          where: {
            evaluationId_questionId: {
              evaluationId: evaluationId,
              questionId: questionId,
            },
          },
          include: {
            question: {
              select: {
                code: {
                  select: {
                    codeReading: {
                      select: {
                        studentOutputTest: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      )

      if (!evaluationToQuestion) {
        res.status(400).json({ message: 'Question not found' })
        return
      }

      if (
        !evaluationToQuestion.question?.code?.codeReading?.studentOutputTest
      ) {
        res
          .status(400)
          .json({ message: 'Outpout testing is not enabled for this question' })
        return
      }

      // Get all student and official outputs
      const studentAnswer = await prisma.studentAnswerCodeReading.findUnique({
        where: {
          userEmail_questionId: {
            questionId: questionId,
            userEmail: studentEmail,
          },
        },
        select: {
          outputs: {
            select: {
              output: true,
              codeReadingSnippet: {
                select: {
                  id: true,
                  order: true,
                  output: true,
                },
              },
            },
            orderBy: {
              codeReadingSnippet: {
                order: 'asc',
              },
            },
          },
        },
      })

      if (!studentAnswer) {
        res.status(400).json({ message: 'Student answer not found' })
        return
      }

      // Compare the student output with the official output (normalize line endings)
      for (const studentAnswerOutput of studentAnswer.outputs) {
        const snippetId = studentAnswerOutput.codeReadingSnippet.id
        const officialOutput = studentAnswerOutput.codeReadingSnippet.output
        const studentOutput = studentAnswerOutput.output

        // Convert to strings and normalize line endings for comparison
        const normalizeLineEndings = (str) =>
          String(str || '')
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
        const studentOutputStr = normalizeLineEndings(studentOutput)
        const officialOutputStr = normalizeLineEndings(officialOutput)
        const passed = studentOutputStr === officialOutputStr

        // Update the student output status
        await prisma.studentAnswerCodeReadingOutput.update({
          where: {
            questionId_userEmail_snippetId: {
              questionId: questionId,
              userEmail: studentEmail,
              snippetId: snippetId,
            },
          },
          data: {
            status: passed
              ? StudentAnswerCodeReadingOutputStatus.MATCH
              : StudentAnswerCodeReadingOutputStatus.MISMATCH,
          },
        })
      }

      // Select the outputs with the status
      const studentOutputs =
        await prisma.studentAnswerCodeReadingOutput.findMany({
          where: {
            questionId: questionId,
            userEmail: studentEmail,
          },
          select: {
            codeReadingSnippet: {
              select: {
                order: true,
              },
            },
            status: true,
          },
          orderBy: {
            codeReadingSnippet: {
              order: 'asc',
            },
          },
        })

      // wait to simulate a long processing
      await new Promise((resolve) => setTimeout(resolve, 200))

      res.status(200).json(studentOutputs)
    },
  ),
)

export default withMethodHandler({
  POST: withAuthorization(withPrisma(post), [Role.PROFESSOR, Role.STUDENT]),
})
