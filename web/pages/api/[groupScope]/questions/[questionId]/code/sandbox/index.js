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
 * Managing the sandbox part of a code question
 * Handles images and beforeAll
 * get: get the sandbox for a code question
 * put: update the sandbox for a code question
 * post: create the sandbox for a code question
 */

const get = async (req, res, prisma) => {
  // get the sandbox for a code question
  const { questionId } = req.query
  const sandbox = await prisma.sandBox.findUnique({
    where: {
      questionId: questionId,
    },
  })
  if (!sandbox) res.status(404).json({ message: 'Sandbox not found' })
  res.status(200).json(sandbox)
}

const put = async (req, res, prisma) => {
  // update a sandbox
  const { questionId } = req.query

  const { image, beforeAll } = req.body

  const sandbox = await prisma.sandBox.update({
    where: {
      questionId: questionId,
    },
    data: {
      image,
      beforeAll,
    },
  })

  res.status(200).json(sandbox)
}

const post = async (req, res, prisma) => {
  // create a new sandbox
  const { questionId } = req.query

  const { image, beforeAll } = req.body

  const sandbox = await prisma.sandBox.create({
    data: {
      image,
      beforeAll,
      questionId: questionId,
    },
  })

  res.status(200).json(sandbox)
}

export default withGroupScope(
  withMethodHandler({
    GET: withAuthorization(withPrisma(get), [Role.PROFESSOR]),
    PUT: withAuthorization(withQuestionUpdate(withPrisma(put)), [
      Role.PROFESSOR,
    ]),
    POST: withAuthorization(withQuestionUpdate(withPrisma(post)), [
      Role.PROFESSOR,
    ]),
  }),
)
