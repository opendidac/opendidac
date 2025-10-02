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
import { Role, QuestionSource } from '@prisma/client'
import { copyQuestion, questionSelectClause } from '@/code/questions'
import {
  withAuthorization,
  withGroupScope,
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { withPrisma } from '@/middleware/withPrisma'

const post = async (req, res, prisma) => {
  const { groupScope, questionId } = req.query

  // Step 1: Retrieve the question
  const question = await prisma.question.findFirst({
    where: {
      id: questionId,
      group: {
        scope: groupScope,
      },
    },
    select: {
      ...questionSelectClause({
        includeTypeSpecific: true,
        includeOfficialAnswers: true,
        includeTags: true,
        includeProfessorOnlyInfo: true,
      }),
      groupId: true, // Need this for copyQuestion function
    },
  })

  let questionCopy = null
  await prisma.$transaction(async (prisma) => {
    // Step 2: Copy the question, the copy is offten done in several queries, so we wrap it in a transaction
    questionCopy = await copyQuestion(prisma, question, QuestionSource.COPY)
  })

  res.status(200).json(questionCopy)
}

export default withGroupScope(
  withMethodHandler({
    POST: withAuthorization(withPrisma(post), [Role.PROFESSOR]),
  }),
)
