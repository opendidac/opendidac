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

import type { NextApiRequest, NextApiResponse } from 'next'
import { Prisma } from '@prisma/client'
import { QuestionStatus, QuestionSource, Role } from '@prisma/client'
import { getUser } from '@/core/auth/auth'
import { withAuthorization } from '@/middleware/withAuthorization'
import { withApiContext } from '@/middleware/withApiContext'
import { IApiContext } from '@/core/types/api'

/**
 * Managing groups
 *
 * get: get all groups (SUPER_ADMIN only)
 * post: create a new group
 *
 */

const SELECT_FOR_GROUP_LISTING: Prisma.GroupInclude = {
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  },
  members: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  },
  _count: {
    select: {
      members: true,
    },
  },
}

type GroupListing = Prisma.GroupGetPayload<{
  include: typeof SELECT_FOR_GROUP_LISTING
}>

type GroupWithMembershipInfo = GroupListing & {
  isCurrentUserMember: boolean
  _count: {
    members: number
    questions: number
    evaluations: number
  }
}

const get = async (
  req: NextApiRequest,
  res: NextApiResponse,
  ctx: IApiContext,
) => {
  const { prisma } = ctx
  // get all groups with their created by information and members
  const user = await getUser(req, res)

  try {
    const groups = await prisma.group.findMany({
      include: SELECT_FOR_GROUP_LISTING,
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Add isCurrentUserMember flag and custom question count for each group
    const groupsWithMembershipInfo = await Promise.all(
      groups.map(async (group: GroupListing) => {
        // Count only ACTIVE questions not from EVAL source
        const activeQuestionCount = await prisma.question.count({
          where: {
            groupId: group.id,
            status: QuestionStatus.ACTIVE,
            source: {
              not: QuestionSource.EVAL,
            },
          },
        })

        // Count only ACTIVE evaluations
        const activeEvaluationCount = await prisma.evaluation.count({
          where: {
            groupId: group.id,
            status: 'ACTIVE',
          },
        })

        return {
          ...group,
          isCurrentUserMember: group.members.some(
            (member) => member.userId === user?.id,
          ),
          _count: {
            ...group._count,
            questions: activeQuestionCount,
            evaluations: activeEvaluationCount,
          },
        }
      }),
    )

    res.status(200).json({ groups: groupsWithMembershipInfo } as {
      groups: GroupWithMembershipInfo[]
    })
  } catch (e) {
    console.error('Error fetching groups:', e)
    res.status(500).json({ message: 'Internal server error' })
  }
}
const post = async (
  req: NextApiRequest,
  res: NextApiResponse,
  ctx: IApiContext,
) => {
  const { prisma, user } = ctx
  const { label, scope, select } = req.body

  // 1. Check if group exists
  const existing = await prisma.group.findUnique({
    where: { label },
    select: { id: true },
  })

  if (existing) {
    return res.status(409).json({
      message: 'A group with that label already exists',
    })
  }

  // 2. Create group + membership in one call
  const group = await prisma.group.create({
    data: {
      label,
      scope,
      createdBy: { connect: { id: user.id } },
      members: {
        create: {
          userId: user.id,
          selected: !!select,
        },
      },
    },
  })

  res.status(200).json(group)
}

export default withApiContext({
  GET: withAuthorization(get, { roles: [Role.SUPER_ADMIN] }),
  POST: withAuthorization(post, { roles: [Role.PROFESSOR] }),
})
