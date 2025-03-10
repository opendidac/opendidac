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

const get = async (req, res, prisma) => {
  const { questionId } = req.query
  const codeWriting = await prisma.codeWriting.findUnique({
    where: { questionId },
  })
  res.status(200).json(codeWriting)
}

const put = async (req, res, prisma) => {
  // enable / disable code check for code writing
  const { questionId } = req.query
  const { codeCheckEnabled } = req.body

  await prisma.codeWriting.update({
    where: { questionId },
    data: { codeCheckEnabled },
  })
  res.status(200).json({ message: 'Code check enabled / disabled' })
}

export default withGroupScope(
  withMethodHandler({
    PUT: withAuthorization(withPrisma(put), [Role.PROFESSOR]),
    GET: withAuthorization(withPrisma(get), [Role.PROFESSOR]),
  }),
)
