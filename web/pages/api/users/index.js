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
import { getUser } from '@/core/auth/auth'

/**
 *
 * Search for users
 * Used by SuperAdmin page and  AutoComplete Search Component when adding a professor to a group
 */
const get = async (req, res, ctx) => {
  const { prisma } = ctx
  const { search, role, page = 1, pageSize = 10 } = req.query
  const pageNumber = parseInt(page)
  const itemsPerPage = parseInt(pageSize)

  if (!role) {
    // only super admin can view all users
    const user = await getUser(req, res)
    if (
      (!search || search.length < 2) &&
      !user.roles.includes(Role.SUPER_ADMIN)
    ) {
      res.status(403).json({ message: 'Forbidden' })
      return
    }
  }

  const roleCondition =
    role && Role[role]
      ? {
          roles: {
            has: Role[role],
          },
        }
      : {}

  const searchCondition =
    search && search.length >= 2
      ? {
          OR: [
            // OR applies on the array of conditions
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              email: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        }
      : {}

  const where = {
    ...roleCondition,
    ...searchCondition,
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        roles: true,
      },
      orderBy: {
        name: 'asc',
      },
      skip: (pageNumber - 1) * itemsPerPage,
      take: itemsPerPage,
    }),
    prisma.user.count({ where }),
  ])

  res.status(200).json({
    users,
    pagination: {
      total,
      page: pageNumber,
      pageSize: itemsPerPage,
      totalPages: Math.ceil(total / itemsPerPage),
    },
  })
}

export default withApiContext({
  GET: withAuthorization(get, {
    roles: [Role.PROFESSOR, Role.SUPER_ADMIN],
  }),
})
