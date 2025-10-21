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
import { getUser } from '@/code/auth/auth'
import {
  withAuthorization,
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { withPrisma } from '@/middleware/withPrisma'

const get = async (req, res, prisma) => {
  const user = await getUser(req, res)
  // get the list of groups that this users is a member of
  const groups = await prisma.userOnGroup.findMany({
    where: {
      userId: user.id,
    },
    include: {
      group: true,
    },
    orderBy: {
      group: {
        createdAt: 'asc',
      },
    },
  })

  res.status(200).json(groups)
}

export default withMethodHandler({
  GET: withAuthorization(withPrisma(get), [Role.PROFESSOR]),
})
