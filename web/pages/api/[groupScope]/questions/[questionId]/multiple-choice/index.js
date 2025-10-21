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
import { Role } from '@prisma/client'

import {
  withAuthorization,
  withGroupScope,
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { withPrisma } from '@/middleware/withPrisma'
import { withQuestionUpdate } from '@/middleware/withUpdate'

/**
 *
 * get: Get the multichoice conf
 */

// get the multichoice
const get = async (req, res, prisma) => {
  const { questionId } = req.query

  const multiChoice = await prisma.multipleChoice.findUnique({
    where: {
      questionId: questionId,
    },
    include: {
      options: {
        orderBy: [
          {
            order: 'asc',
          },
          {
            id: 'asc', // For historical options before the order was added
          },
        ],
      },
    },
  })

  res.status(200).json(multiChoice)
}

// update the multichoice first level attributes
const put = async (req, res, prisma) => {
  const { questionId } = req.query
  const {
    activateStudentComment,
    studentCommentLabel,
    activateSelectionLimit,
    gradingPolicy,
  } = req.body

  const multiChoice = await prisma.multipleChoice.findUnique({
    where: {
      questionId: questionId,
    },
    include: {
      options: true,
    },
  })

  if (!multiChoice) {
    return res.status(404).json({ error: 'Question not found' })
  }

  // update the multichoice
  const updatedMultiChoice = await prisma.multipleChoice.update({
    where: { questionId: questionId },
    data: {
      activateStudentComment: activateStudentComment,
      studentCommentLabel: studentCommentLabel,
      activateSelectionLimit: activateSelectionLimit,
      selectionLimit: activateSelectionLimit
        ? multiChoice.options.filter((o) => o.isCorrect).length
        : 0,
      gradingPolicy: gradingPolicy,
    },
  })

  res.status(200).json(updatedMultiChoice)
}

export default withGroupScope(
  withMethodHandler({
    GET: withAuthorization(withPrisma(get), [Role.PROFESSOR]),
    PUT: withAuthorization(withQuestionUpdate(withPrisma(put)), [
      Role.PROFESSOR,
    ]),
  }),
)
