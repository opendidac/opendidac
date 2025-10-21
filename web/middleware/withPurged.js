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

import { getPrisma } from './withPrisma'

export const withPurgeGuard = (handler) => {
  return async (req, res) => {
    const prisma = getPrisma()
    const { evaluationId } = req.query || {}

    if (!evaluationId) {
      return handler(req, res)
    }

    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      select: { id: true, purgedAt: true },
    })

    if (evaluation?.purgedAt) {
      return res.status(410).json({
        type: 'info',
        id: 'evaluation-purged',
        message: 'Evaluation data has been purged.',
      })
    }

    return handler(req, res)
  }
}
