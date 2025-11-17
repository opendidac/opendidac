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

/** Managing the members of a group
 *
 * get: list members of a group
 * post: add a member to a group
 * del: remove a member from a group
 */

const get = async (ctx, args) => {
  const { req, res, prisma } = ctx
  // get all members of group
  const { groupId } = req.query

  // check if the users is a member of the group they are trying to get members of
  const user = await getUser(req, res)

  if (!user) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

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

  const members = await prisma.group.findUnique({
    where: {
      id: groupId,
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
  })

  res.status(200).json(members)
}

const post = async (ctx, args) => {
  const { req, res, prisma } = ctx
  // add member to group
  const { groupId } = req.query
  const { member } = req.body

  const requester = await getUser(req, res)

  if (!requester) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  const requesterIsMemberOfGroup = await prisma.group.findFirst({
    where: {
      id: groupId,
      members: {
        some: {
          userId: requester.id,
        },
      },
    },
  })

  // Allow if user is a member of the group OR if user is SUPER_ADMIN
  if (!requesterIsMemberOfGroup && !requester.roles.includes('SUPER_ADMIN')) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  try {
    const membership = await prisma.userOnGroup.create({
      data: {
        userId: member.id,
        groupId,
      },
      select: {
        user: true,
      },
    })

    res.status(200).json(membership)
  } catch (e) {
    switch (e.code) {
      case 'P2002':
        res.status(409).json({ message: 'Member already exists' })
        break
      default:
        res.status(500).json({ message: 'Internal server error' })
    }
  }
}

const del = async (ctx, args) => {
  const { req, res, prisma } = ctx
  // remove a member from a group
  const { groupId } = req.query
  const { userId: targetUserId } = req.body || {}

  const requester = await getUser(req, res)

  if (!requester) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  if (!targetUserId) {
    res.status(400).json({ message: 'Missing userId' })
    return
  }

  // Ensure requester is a member of the group (or SUPER_ADMIN as a safety net)
  const requesterIsMemberOfGroup = await prisma.group.findFirst({
    where: {
      id: groupId,
      members: {
        some: {
          userId: requester.id,
        },
      },
    },
    select: { id: true, createdById: true },
  })

  if (!requesterIsMemberOfGroup && !requester.roles?.includes('SUPER_ADMIN')) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  // Prevent removing the creator of the group
  if (requesterIsMemberOfGroup?.createdById === targetUserId) {
    res
      .status(400)
      .json({ message: 'The creator of the group cannot be removed' })
    return
  }

  // Remove the member from the group
  await prisma.userOnGroup.delete({
    where: {
      userId_groupId: {
        userId: targetUserId,
        groupId,
      },
    },
  })

  res.status(200).json({ message: 'Member removed' })
}

export default withMethodHandler({
  GET: withAuthorization(withPrisma(get), { roles: [Role.PROFESSOR] }),
  POST: withAuthorization(withPrisma(post), { roles: [Role.PROFESSOR] }),
  DELETE: withAuthorization(withPrisma(del), { roles: [Role.PROFESSOR] }),
})
