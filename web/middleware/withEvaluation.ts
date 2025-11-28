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

import type { Prisma } from '@prisma/client'
import type {
  IApiContext,
  IApiContextWithEvaluation,
} from '@/types/api/context'

/**
 * Public contract for what ctx.evaluation contains.
 * Shared select for withEvaluation middleware.
 *
 * IMPORTANT:
 * - Keep this minimal to avoid overfetching.
 * - Any new field must be audited in all /api/users (student) endpoints.
 */
export const evaluationContextSelect = {
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
} as const

/**
 * Derived TS type: the exact structure returned by the select above.
 * @deprecated Use IEvaluationInContext from '@/types/api/context' instead
 */
export type EvaluationInContext = Prisma.EvaluationGetPayload<{
  select: typeof evaluationContextSelect
}>

// Re-export the interface version for consistency
export type { IEvaluationInContext } from '@/types/api/context'

/**
 * Middleware: fetches evaluation, injects it into ctx.
 */
export const withEvaluation =
  (handler: (ctx: IApiContextWithEvaluation | IApiContext) => Promise<any>) =>
  async (ctx: IApiContext): Promise<any> => {
    const { prisma } = ctx
    const { evaluationId } = ctx.req.query

    if (!prisma) {
      return ctx.res.error(
        'Prisma client not available. Did you call withPrisma middleware?',
      )
    }

    if (!evaluationId) {
      // No evaluation in URL → just continue
      return handler(ctx)
    }

    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId as string },
      select: evaluationContextSelect,
    })

    if (!evaluation) {
      return ctx.res.notFound('Evaluation not found')
    }

    // Inject evaluation into context
    const ctxWithEvaluation: IApiContextWithEvaluation = {
      ...ctx,
      evaluation,
    }

    return handler(ctxWithEvaluation)
  }
