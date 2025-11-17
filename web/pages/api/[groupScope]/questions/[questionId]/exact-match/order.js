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

import {
  withAuthorization,
  withGroupScope,
} from '@/middleware/withAuthorization'
import { withMethodHandler } from '@/middleware/withMethodHandler'
import { withQuestionUpdate } from '@/middleware/withUpdate'
import { withPrisma } from '@/middleware/withPrisma'
import { Role } from '@prisma/client'

const put = async (ctx) => {
  const { req, res, prisma } = ctx
  const { fields } = req.body

  await prisma.$transaction(async (prisma) => {
    for (const [_, field] of fields.entries()) {
      await prisma.exactMatchField.update({
        where: { id: field.id },
        data: {
          order: field.order,
        },
      })
    }
  })

  res.status(200).json({ message: 'Order changed successfully' })
}

export default withMethodHandler({
  PUT: withGroupScope(
    withAuthorization(withPrisma(withQuestionUpdate(put)), {
      roles: [Role.PROFESSOR],
    }),
  ),
})
