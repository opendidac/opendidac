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
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { withPrisma } from '@/middleware/withPrisma'

/**
 *
 * Update the roles of the user
 */
const patch = async (req, res, prisma) => {
  const { roles } = req.body

  const { userId } = req.query

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  })

  if (!user) {
    res.status(404).json({ message: 'Not found' })
    return
  }

  // check if roles are valid
  if (roles) {
    const validRoles = Object.keys(Role).map((key) => Role[key])
    if (roles.filter((role) => !validRoles.includes(role)).length > 0) {
      res.status(400).json({ message: 'Invalid roles' })
      return
    }
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      roles,
    },
  })

  res.status(200).json(updatedUser)
}

export default withMethodHandler({
  PATCH: withAuthorization(withPrisma(patch), [Role.SUPER_ADMIN]),
})
