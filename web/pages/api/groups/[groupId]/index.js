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
import { withAuthorization } from '@/middleware/withAuthorization'
import { withMethodHandler } from '@/middleware/withMethodHandler'
import { withPrisma } from '@/middleware/withPrisma'
/**
 * Managing group
 *
 * del: delete a group
 * put: update a group label
 */
const del = async (ctx) => {
  const { req, res, prisma } = ctx
  // delete a group
  const { groupId } = req.query

  const user = await getUser(req, res)

  // check if the users is an owner of the group they are trying to delete
  const userIsOwnerOfGroup = await prisma.group.findFirst({
    where: {
      id: groupId,
      createdBy: {
        id: user.id,
      },
    },
  })

  if (!userIsOwnerOfGroup) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  await prisma.group.delete({
    where: {
      id: groupId,
    },
  })

  res.status(200).json({ message: 'Group deleted' })
}

const put = async (ctx) => {
  const { req, res, prisma } = ctx
  // update a group
  const { groupId } = req.query
  const { label, scope } = req.body

  const user = await getUser(req, res)

  // check if the users is a member of the group they are trying to update
  const userIsMemberOfGroup = await prisma.group.findFirst({
    where: {
      id: groupId,
      members: {
        some: {
          userId: user.id,
        },
      },
    },
  })

  if (!userIsMemberOfGroup) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  // check if the label is not already taken
  const labelIsTaken = await prisma.group.findFirst({
    where: {
      OR: [{ label: label }, { scope: scope }],
      id: {
        not: groupId,
      },
    },
  })

  if (labelIsTaken) {
    res.status(400).json({ message: 'Label is already taken' })
    return
  }

  const updatedGroup = await prisma.group.update({
    where: {
      id: groupId,
    },
    data: {
      label: label,
      scope: scope,
    },
  })

  res.status(200).json(updatedGroup)
}

export default withMethodHandler({
  DELETE: withAuthorization(withPrisma(del), { roles: [Role.PROFESSOR] }),
  PUT: withAuthorization(withPrisma(put), { roles: [Role.PROFESSOR] }),
})
