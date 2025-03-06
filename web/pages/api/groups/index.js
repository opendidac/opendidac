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
/**
 * Managing groups
 *
 * post: create a new group
 *
 */

const post = async (req, res, prisma) => {
  // create a new group
  const { label, scope, select } = req.body

  const user = await getUser(req, res)

  try {
    const group = await prisma.group.create({
      data: {
        label: label,
        scope: scope,
        createdBy: {
          connect: {
            id: user.id,
          },
        },
        members: {
          create: {
            userId: user.id,
          },
        },
      },
    })

    if (select) {
      await prisma.userOnGroup.upsert({
        where: {
          userId_groupId: {
            userId: user.id,
            groupId: group.id,
          },
        },
        update: {
          selected: true,
        },
        create: {
          selected: true,
        },
      })
    }

    res.status(200).json(group)
  } catch (e) {
    switch (e.code) {
      case 'P2002':
        res
          .status(409)
          .json({ message: 'A group with that label already exists' })
        break
      default:
        res.status(500).json({ message: 'Internal server error' })
    }
  }
}

export default withMethodHandler({
  POST: withAuthorization(withPrisma(post), [Role.PROFESSOR]),
})
