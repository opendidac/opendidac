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
 * Get the code reading part of a code question
 * Includes sandbox and snippets
 *
 */

const get = async (req, res, prisma) => {
  //
  const { questionId } = req.query
  const codeReading = await prisma.codeReading.findUnique({
    where: {
      questionId: questionId,
    },
  })

  if (!codeReading) res.status(404).json({ message: 'Code not found' })

  res.status(200).json(codeReading)
}

const put = async (req, res, prisma) => {
  // update a code reading
  const { questionId } = req.query

  const { studentOutputTest, contextExec, context } = req.body

  const codeReading = await prisma.codeReading.update({
    where: {
      questionId: questionId,
    },
    data: {
      context: context.context,
      contextPath: context.contextPath,
      contextExec: contextExec,
      studentOutputTest: studentOutputTest,
    },
  })

  res.status(200).json(codeReading)
}

export default withGroupScope(
  withMethodHandler({
    GET: withAuthorization(withPrisma(get), [Role.PROFESSOR]),
    PUT: withAuthorization(withQuestionUpdate(withPrisma(put)), [
      Role.PROFESSOR,
    ]),
  }),
)
