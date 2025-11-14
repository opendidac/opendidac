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

/**
 * Middleware that fetches the evaluation and adds it to the context
 * Fetches all commonly needed first-level fields to avoid redundant queries
 *
 * @requires The endpoint must have [evaluationId] in its URL path
 *           (e.g., /api/users/evaluations/[evaluationId]/status)
 *           The evaluationId will be extracted from req.query.evaluationId
 *
 * @note If evaluationId is not present in req.query, the middleware
 *       will pass through to the handler without adding evaluation to context
 *
 * @important If you add fields, make sure to control all student /api/users endpoints for overfetch to not send any sensitive data to the student.
 */
export const withEvaluation = (handler, args = {}) => {
  return async (ctx) => {
    const { req, res, prisma } = ctx
    const { evaluationId } = req.query

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

    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      select: {
        id: true,
        phase: true,
        label: true,
        desktopAppRequired: true,
        ipRestrictions: true,
        accessMode: true,
        accessList: true,
        durationActive: true,
        startAt: true,
        endAt: true,
        conditions: true,
        consultationEnabled: true,
        showSolutionsWhenFinished: true,
        purgedAt: true,
        archivedAt: true,
        archivalPhase: true,
      },
    })

    if (!evaluation) {
      return res.status(404).json({
        type: 'error',
        id: 'not-found',
        message: 'Evaluation not found',
      })
    }

    // Add evaluation to context
    const ctxWithEvaluation = { ...ctx, evaluation }
    return handler(ctxWithEvaluation, args)
  }
}
