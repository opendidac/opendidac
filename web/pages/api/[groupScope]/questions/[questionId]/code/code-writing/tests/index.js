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
 * Managing the test cases of a code question
 * get: get the list of test cases for a code question
 * post: create a new test case for a code question
 */

const get = async (req, res, prisma) => {
  // get the list of test cases for a code question
  const { questionId } = req.query
  const testCases = await prisma.testCase.findMany({
    where: {
      questionId: questionId,
    },
    orderBy: {
      index: 'asc',
    },
  })
  if (!testCases) res.status(404).json({ message: 'Test cases not found' })
  res.status(200).json(testCases)
}

const post = async (req, res, prisma) => {
  // create a new test case for a code question
  const { questionId } = req.query
  const { exec, input, expectedOutput } = req.body

  const count = await prisma.testCase.count({
    where: {
      questionId: questionId,
    },
  })

  const testCase = await prisma.testCase.create({
    data: {
      index: count + 1,
      exec,
      input,
      expectedOutput,
      questionId: questionId,
    },
  })
  res.status(200).json(testCase)
}

export default withGroupScope(
  withMethodHandler({
    GET: withAuthorization(withPrisma(get), [Role.PROFESSOR]),
    POST: withAuthorization(withQuestionUpdate(withPrisma(post)), [
      Role.PROFESSOR,
    ]),
  }),
)
