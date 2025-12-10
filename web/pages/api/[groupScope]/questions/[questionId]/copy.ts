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

import util from 'util'
import { Role, QuestionSource, Prisma, PrismaClient } from '@prisma/client'

import {
  withAuthorization,
  withGroupScope,
} from '@/middleware/withAuthorization'
import { withApiContext } from '@/middleware/withApiContext'
import type { IApiContext } from '@/core/types/api'
import { selectForQuestionCopy } from '@/core/question/select'
import { copyQuestion } from '@/core/question/copy'

const post = async (ctx: IApiContext) => {
  const { req, res, prisma } = ctx
  const { groupScope, questionId } = req.query

  if (!questionId || typeof questionId !== 'string') {
    res.status(400).json({ message: 'Invalid questionId' })
    return
  }

  if (!groupScope || typeof groupScope !== 'string') {
    res.status(400).json({ message: 'Invalid groupScope' })
    return
  }

  console.log(
    'selectForQuestionCopy',
    util.inspect(selectForQuestionCopy(), { depth: null }),
  )

  // Step 1: Retrieve the question
  const question = await prisma.question.findFirst({
    where: {
      id: questionId,
      group: {
        scope: groupScope,
      },
    },
    select: {
      ...selectForQuestionCopy(),
      groupId: true, // Need this for copyQuestion function
    },
  })

  if (!question) {
    res.status(404).json({ message: 'Question not found' })
    return
  }

  // Step 2: Copy the question, the copy is often done in several queries, so we wrap it in a transaction
  let questionCopy = null
  await (prisma as PrismaClient).$transaction(
    async (tx: Prisma.TransactionClient) => {
      questionCopy = await copyQuestion(question.id, {
        source: QuestionSource.COPY,
        prefix: 'Copy of ',
      })
    },
  )

  res.status(200).json(questionCopy)
}

export default withApiContext({
  POST: withGroupScope(withAuthorization(post, { roles: [Role.PROFESSOR] })),
})
