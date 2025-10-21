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
 * Managing the code files depending on their nature (solution or template)
 * get: get the [nature] files for a code question
 * post: create a new file for a code question
 */

const get = async (req, res, prisma) => {
  // get the [nature] files for a code question

  const { questionId, nature } = req.query

  const model =
    nature === 'solution'
      ? prisma.codeToSolutionFile
      : prisma.codeToTemplateFile

  const codeToFiles = await model.findMany({
    where: { questionId },
    orderBy: { order: 'asc' },
    include: {
      file: true,
    },
  })

  if (!codeToFiles) res.status(404).json({ message: 'Not found' })

  res.status(200).json(codeToFiles)
}

const post = async (req, res, prisma) => {
  // create a new file for a code question
  // as the file is created for a code question we handle it through CodeToFile entity

  const { questionId, nature } = req.query
  const {
    file: { path, content },
  } = req.body

  const model =
    nature === 'solution'
      ? prisma.codeToSolutionFile
      : prisma.codeToTemplateFile

  const order = await model.count({ where: { questionId } })

  const codeToFile = await model.create({
    data: {
      order: order,
      file: {
        create: {
          path,
          content,
          code: {
            connect: { questionId },
          },
        },
      },
      code: {
        connect: {
          questionId: questionId,
        },
      },
    },
    include: {
      file: true,
    },
  })

  if (!codeToFile) res.status(404).json({ message: 'Not found' })

  res.status(200).json(codeToFile)
}

export default withGroupScope(
  withMethodHandler({
    GET: withAuthorization(withPrisma(get), [Role.PROFESSOR]),
    POST: withAuthorization(withQuestionUpdate(withPrisma(post)), [
      Role.PROFESSOR,
    ]),
  }),
)
