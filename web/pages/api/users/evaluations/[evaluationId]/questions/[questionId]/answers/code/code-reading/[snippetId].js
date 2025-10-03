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
  StudentAnswerStatus,
  UserOnEvaluationStatus,
} from '@prisma/client'
import { grading } from '@/code/grading/engine'
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
  Student updated his answer to a code reading snippet during an evaluation

*/
const put = withEvaluationPhase(
  [EvaluationPhase.IN_PROGRESS],
  withStudentStatus(
    [UserOnEvaluationStatus.IN_PROGRESS],
    async (req, res, prisma) => {
      const user = await getUser(req, res)
      const studentEmail = user.email
      const { evaluationId, questionId, snippetId } = req.query

      const { output } = req.body

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
                    codeType: true, // For grading
                    codeReading: {
                      select: {
                        snippets: {
                          // To set the StudentAnswerCodeReadingOutput status
                          where: {
                            id: snippetId,
                          },
                          select: {
                            output: true,
                          },
                        },
                      },
                    },
                  },
                },
                type: true, // For grading
              },
            },
          },
        },
      )

      if (!evaluationToQuestion) {
        res.status(400).json({ message: 'Question not found' })
        return
      }

      await prisma.$transaction(async (prisma) => {
        // update the status of the users answers

        await prisma.studentAnswer.update({
          where: {
            userEmail_questionId: {
              userEmail: studentEmail,
              questionId: questionId,
            },
          },
          data: {
            status: StudentAnswerStatus.IN_PROGRESS,
          },
        })

        // Get the official output for this snippet (already filtered by snippetId in the query)
        const officialOutput =
          evaluationToQuestion.question.code.codeReading.snippets[0]?.output

        if (officialOutput === undefined) {
          res.status(400).json({ message: 'Snippet not found' })
          return
        }

        // Convert to strings and normalize line endings for comparison
        const normalizeLineEndings = (str) =>
          String(str || '')
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
        const studentOutputStr = normalizeLineEndings(output)
        const officialOutputStr = normalizeLineEndings(officialOutput)

        // update the users answers file for code reading question
        await prisma.studentAnswerCodeReadingOutput.update({
          where: {
            questionId_userEmail_snippetId: {
              questionId: questionId,
              userEmail: studentEmail,
              snippetId: snippetId,
            },
          },
          data: {
            output: output,
            status:
              studentOutputStr === officialOutputStr
                ? StudentAnswerCodeReadingOutputStatus.MATCH
                : StudentAnswerCodeReadingOutputStatus.MISMATCH,
          },
        })

        // Get all student outputs
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
                status: true, // Include status for grading
                codeReadingSnippet: {
                  select: {
                    output: true,
                  },
                },
              },
            },
          },
        })

        // grade question
        await prisma.studentQuestionGrading.upsert({
          where: {
            userEmail_questionId: {
              userEmail: studentEmail,
              questionId: questionId,
            },
          },
          create: {
            userEmail: studentEmail,
            questionId: questionId,
            ...grading(
              evaluationToQuestion.question,
              evaluationToQuestion.points,
              studentAnswer,
            ),
          },
          update: grading(
            evaluationToQuestion.question,
            evaluationToQuestion.points,
            studentAnswer,
          ),
        })
      })

      const updatedAnswer = await prisma.studentAnswer.findUnique({
        where: {
          userEmail_questionId: {
            userEmail: studentEmail,
            questionId: questionId,
          },
        },
        select: {
          status: true,
          code: {
            select: {
              codeReading: {
                select: {
                  outputs: {
                    select: {
                      output: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
      res.status(200).json(updatedAnswer)
    },
  ),
)

export default withMethodHandler({
  PUT: withAuthorization(withPrisma(put), [Role.PROFESSOR, Role.STUDENT]),
})
