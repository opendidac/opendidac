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
 * Check the group existence
 * Used by the group creation form to check if a group with the given label already exists
 *
 * get: check if a group with the given label exists
 *
 */

const get = async (req, res, prisma) => {
  const { label, scope, groupId } = req.query

  let whereClause = {
    OR: [{ label: label }, { scope: scope }],
  }

  if (groupId) {
    // update mode
    whereClause = {
      ...whereClause,
      NOT: { id: groupId },
    }
  }

  const group = await prisma.group.findFirst({
    where: whereClause,
  })

  if (group) {
    res.status(200).json({ exists: true })
  } else {
    res.status(200).json({ exists: false })
  }
}

export default withMethodHandler({
  GET: withAuthorization(withPrisma(get), [Role.PROFESSOR]),
})
