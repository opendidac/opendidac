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

export const withPurgeGuard = (handler, args = {}) => {
  return async (ctx) => {
    const { req, res, prisma, evaluation } = ctx
    const { evaluationId } = req.query || {}

    if (!prisma) {
      return res.status(500).json({
        type: 'error',
        message:
          'Prisma client not available. Did you call withPrisma middleware?',
      })
    }

    if (!evaluationId) {
      return handler(ctx, args)
    }

    // Use evaluation from context if available (from withEvaluation middleware),
    // otherwise fetch it (for backward compatibility)
    const evalToCheck =
      evaluation ||
      (await prisma.evaluation.findUnique({
        where: { id: evaluationId },
        select: { id: true, purgedAt: true },
      }))

    if (!evalToCheck) {
      return res.status(404).json({
        type: 'error',
        id: 'not-found',
        message: 'Evaluation not found',
      })
    }

    if (evalToCheck.purgedAt) {
      return res.status(410).json({
        type: 'info',
        id: 'evaluation-purged',
        message: 'Evaluation data has been purged.',
      })
    }

    return handler(ctx, args)
  }
}
