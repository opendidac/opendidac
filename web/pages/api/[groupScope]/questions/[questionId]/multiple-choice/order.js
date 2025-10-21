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

/** Managing the order of the options of a multichoice question */

const put = async (req, res, prisma) => {
  // update the order of the options in the multiple choice question
  const { options } = req.body

  // update the order of the questions in the collection
  for (const [_, option] of options.entries()) {
    await prisma.option.update({
      where: {
        id: option.id,
      },
      data: {
        order: option.order,
      },
    })
  }

  res.status(200).json({ message: 'OK' })
}

export default withGroupScope(
  withMethodHandler({
    PUT: withAuthorization(withQuestionUpdate(withPrisma(put)), [
      Role.PROFESSOR,
    ]),
  }),
)
