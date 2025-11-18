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
  StudentAnswerStatus,
  UserOnEvaluationStatus,
} from '@prisma/client'

import { grading } from '@/code/grading/engine'
import { withAuthorization } from '@/middleware/withAuthorization'
import { withApiContext } from '@/middleware/withApiContext'
import {
  withEvaluationPhase,
  withStudentStatus,
} from '@/middleware/withStudentEvaluation'
import { getUser } from '@/code/auth/auth'

const addOrRemoveOption = async (ctx) => {
  const { req, res, prisma } = ctx
  const user = await getUser(req, res)
  const studentEmail = user.email
  const { evaluationId, questionId } = req.query

  const toAdd = req.method === 'POST'

  const { option } = req.body

  // Get all options including their official answer status,
  // these are used to grade the user's answers
  // WARNING! they should not be returned by the api to the users
  const evaluationToQuestion = await prisma.evaluationToQuestion.findUnique({
    where: {
      evaluationId_questionId: {
        evaluationId: evaluationId,
        questionId: questionId,
      },
    },
    include: {
      question: {
        include: {
          multipleChoice: {
            select: {
              options: true,
              activateSelectionLimit: true,
              selectionLimit: true,
              gradingPolicy: true,
            },
          },
        },
      },
    },
  })

  if (!evaluationToQuestion) {
    res.status(400).json({ message: 'Internal Server Error' })
    return
  }

  const { multipleChoice } = evaluationToQuestion.question
  const radio =
    multipleChoice.activateSelectionLimit && multipleChoice.selectionLimit === 1
  const limit = multipleChoice.activateSelectionLimit
    ? multipleChoice.selectionLimit
    : Infinity

  let status = StudentAnswerStatus.IN_PROGRESS

  const transaction = [] // to do in single transaction, queries are done in order

  if (radio) {
    // If radio behavior, deselect all other options
    transaction.push(
      prisma.studentAnswerMultipleChoice.update({
        where: {
          userEmail_questionId: {
            userEmail: studentEmail,
            questionId: questionId,
          },
        },
        data: {
          options: {
            set: [], // Deselect all options
          },
        },
      }),
    )
  } else {
    const studentAnswer = await prisma.studentAnswerMultipleChoice.findUnique({
      where: {
        userEmail_questionId: {
          userEmail: studentEmail,
          questionId: questionId,
        },
      },
      select: {
        options: {
          select: {
            id: true,
            text: true,
          },
        },
      },
    })

    const selectedOptions = studentAnswer.options

    // Prevent selecting more than the limit
    if (selectedOptions.length >= limit && toAdd) {
      res.status(400).json({ message: 'Selection limit reached' })
      return
    }
  }

  // Add or remove option to/from user's multi-choice answers
  transaction.push(
    prisma.studentAnswerMultipleChoice.update({
      where: {
        userEmail_questionId: {
          userEmail: studentEmail,
          questionId: questionId,
        },
      },
      data: {
        options: {
          [toAdd ? 'connect' : 'disconnect']: {
            id: option.id,
          },
        },
      },
    }),
  )

  // Update the status of the user's answers
  if (!toAdd) {
    // Check if the option to remove is the only one selected, if so, set status to missing
    const studentAnswer = await prisma.studentAnswerMultipleChoice.findUnique({
      where: {
        userEmail_questionId: {
          userEmail: studentEmail,
          questionId: questionId,
        },
      },
      select: {
        options: {
          select: {
            id: true,
            text: true,
          },
        },
      },
    })

    if (studentAnswer.options.length === 1) {
      status = StudentAnswerStatus.MISSING
    }
  }

  transaction.push(
    prisma.studentAnswer.update({
      where: {
        userEmail_questionId: {
          userEmail: studentEmail,
          questionId: questionId,
        },
      },
      data: {
        status,
      },
    }),
  )

  // Execute the prisma transaction
  await prisma.$transaction(transaction)

  // Get the updated user's answers
  const studentAnswer = await prisma.studentAnswerMultipleChoice.findUnique({
    where: {
      userEmail_questionId: {
        userEmail: studentEmail,
        questionId: questionId,
      },
    },
    select: {
      options: {
        select: {
          id: true,
          text: true,
        },
      },
    },
  })

  // Grade the user's answers
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

  // Get the updated user's answers -> do not return the options official answer status "isCorrect"
  const updatedStudentAnswer = await prisma.studentAnswer.findUnique({
    where: {
      userEmail_questionId: {
        userEmail: studentEmail,
        questionId: questionId,
      },
    },
    select: {
      status: true,
      multipleChoice: {
        include: {
          options: {
            select: {
              id: true,
              text: true,
            },
          },
        },
      },
    },
  })

  res.status(200).json(updatedStudentAnswer)
}

export default withApiContext({
  POST: withAuthorization(
    withEvaluationPhase(
      withStudentStatus(addOrRemoveOption, {
        statuses: [UserOnEvaluationStatus.IN_PROGRESS],
      }),
      { phases: [EvaluationPhase.IN_PROGRESS] },
    ),
    { roles: [Role.PROFESSOR, Role.STUDENT] },
  ),
  DELETE: withAuthorization(
    withEvaluationPhase(
      withStudentStatus(addOrRemoveOption, {
        statuses: [UserOnEvaluationStatus.IN_PROGRESS],
      }),
      { phases: [EvaluationPhase.IN_PROGRESS] },
    ),
    { roles: [Role.PROFESSOR, Role.STUDENT] },
  ),
})
