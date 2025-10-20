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

import { Role, QuestionStatus } from '@prisma/client'
import {
  withAuthorization,
  withGroupScope,
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { withPrisma } from '@/middleware/withPrisma'

const unarchive = async (req, res, prisma) => {
  const { questionId } = req.query
  const question = await prisma.question.findUnique({
    where: { id: questionId },
  })

  if (!question) {
    res.status(404).json({ message: 'Question not found' })
    return
  }

  if (question.status !== QuestionStatus.ARCHIVED) {
    res.status(400).json({ message: 'Question is not archived' })
    return
  }

  // Restore the question to active status
  const restoredQuestion = await prisma.question.update({
    where: { id: questionId },
    data: {
      status: QuestionStatus.ACTIVE,
    },
  })

  res.status(200).json(restoredQuestion)
}

export default withGroupScope(
  withMethodHandler({
    POST: withAuthorization(withPrisma(unarchive), [Role.PROFESSOR]),
  }),
)
