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
import { withAuthorization } from '@/middleware/withAuthorization'
import { withApiContext } from '@/middleware/withApiContext'

const get = async (ctx) => {
  const { res, prisma, user } = ctx
  if (!user) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }
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

  res.ok(groups)
}

export default withApiContext({
  GET: withAuthorization(get, { roles: [Role.PROFESSOR] }),
})
