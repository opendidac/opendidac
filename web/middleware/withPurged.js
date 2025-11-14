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

    // Evaluation must be provided by withEvaluation middleware
    if (!evaluation) {
      return res.status(500).json({
        type: 'error',
        message:
          'Evaluation not available in context. Did you call withEvaluation middleware?',
      })
    }

    const evalToCheck = evaluation

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
