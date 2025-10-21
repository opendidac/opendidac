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
 * Managing the code snippets part of a code question
 * get: get the code snippets for a code question
 * post: create a new snippet for a code question
 */

const get = async (req, res, prisma) => {
  // get the [nature] files for a code question

  const { questionId } = req.query

  const snippets = await prisma.codeReadingSnippet.findMany({
    where: { questionId },
    orderBy: { order: 'asc' },
  })

  if (!snippets) res.status(404).json({ message: 'Not found' })

  res.status(200).json(snippets)
}

const post = async (req, res, prisma) => {
  // create a new snippet for a code question

  const { questionId } = req.query

  const { order } = req.body

  const codeReadingSnippet = await prisma.codeReadingSnippet.create({
    data: {
      order,
      questionId,
    },
  })

  res.status(200).json(codeReadingSnippet)
}

export default withGroupScope(
  withMethodHandler({
    GET: withAuthorization(withPrisma(get), [Role.PROFESSOR]),
    POST: withAuthorization(withQuestionUpdate(withPrisma(post)), [
      Role.PROFESSOR,
    ]),
  }),
)
