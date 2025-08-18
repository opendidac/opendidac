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
import { getUser } from '@/code/auth/auth'

const post = async (req, res, prisma) => {
  const { evaluationId } = req.query
  const { archiveDate } = req.body

  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    select: { id: true, archivedAt: true },
  })

  if (!evaluation) {
    res.status(404).json({ message: 'Evaluation not found' })
    return
  }

  if (evaluation.archivedAt) {
    res.status(400).json({ message: 'Evaluation is already archived' })
    return
  }

  // Get the user performing the archival
  const user = await getUser(req, res)
  if (!user) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  // Validate archive date
  const archiveDateObj = archiveDate ? new Date(archiveDate) : new Date()
  if (archiveDate && isNaN(archiveDateObj.getTime())) {
    res.status(400).json({ message: 'Invalid archive date' })
    return
  }

  // Archive the evaluation
  const archivedEvaluation = await prisma.evaluation.update({
    where: { id: evaluationId },
    data: {
      archivedAt: archiveDateObj,
      archivedByUserEmail: user.email,
    },
    include: {
      group: true,
      archivedBy: true,
    },
  })

  res.status(200).json(archivedEvaluation)
}

export default withMethodHandler({
  POST: withAuthorization(withPrisma(post), [Role.SUPER_ADMIN]),
})
