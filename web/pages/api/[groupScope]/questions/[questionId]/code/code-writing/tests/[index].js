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
 * Managing the test cases of a question
 * put: update a test case
 * del: delete a test case
 */

const put = async (req, res, prisma) => {
  // update a test case
  const { questionId, index } = req.query
  const { exec, input, expectedOutput } = req.body
  const testCase = await prisma.testCase.update({
    where: {
      index_questionId: {
        index: parseInt(index),
        questionId: questionId,
      },
    },
    data: {
      exec,
      input,
      expectedOutput,
    },
  })
  res.status(200).json(testCase)
}

const del = async (req, res, prisma) => {
  const { questionId, index } = req.query

  // update the index of the test cases after the deleted one
  const testCases = await prisma.testCase.findMany({
    where: {
      questionId: questionId,
      index: {
        gt: parseInt(index),
      },
    },
  })

  await prisma.$transaction(async (prisma) => {
    await prisma.testCase.delete({
      where: {
        index_questionId: {
          index: parseInt(index),
          questionId: questionId,
        },
      },
    })

    for (let i = 0; i < testCases.length; i++) {
      await prisma.testCase.update({
        where: {
          index_questionId: {
            index: testCases[i].index,
            questionId: questionId,
          },
        },
        data: {
          index: testCases[i].index - 1,
        },
      })
    }
  })

  res.status(200).json('Test case deleted')
}

export default withGroupScope(
  withMethodHandler({
    PUT: withAuthorization(withQuestionUpdate(withPrisma(put)), [
      Role.PROFESSOR,
    ]),
    DELETE: withAuthorization(withQuestionUpdate(withPrisma(del)), [
      Role.PROFESSOR,
    ]),
  }),
)
