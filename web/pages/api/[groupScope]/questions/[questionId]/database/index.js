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
 * Managing the database part of a question
 * Holds the image of the database question
 *
 * get: get the database part of a question
 * put: update the database part of a question
 */

const get = async (req, res, prisma) => {
  // get the "database" part of the question
  const { questionId } = req.query
  const database = await prisma.database.findUnique({
    where: {
      questionId: questionId,
    },
  })

  res.status(200).json(database)
}

const put = async (req, res, prisma) => {
  // update the "database" part of the question
  const { questionId } = req.query
  const { image } = req.body

  const database = await prisma.database.update({
    where: {
      questionId: questionId,
    },
    data: {
      image: image,
    },
  })

  res.status(200).json(database)
}

export default withGroupScope(
  withMethodHandler({
    GET: withAuthorization(withPrisma(get), [Role.PROFESSOR]),
    PUT: withAuthorization(withQuestionUpdate(withPrisma(put)), [
      Role.PROFESSOR,
    ]),
  }),
)
