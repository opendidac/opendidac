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

function withEntityUpdate(updateFunction) {
  return function (handler, args = {}) {
    return async (ctx) => {
      const { req, res, prisma } = ctx

      if (!prisma) {
        return res.status(500).json({
          type: 'error',
          message:
            'Prisma client not available. Did you call withPrisma middleware?',
        })
      }

      // Execute the original handler
      try {
        await handler(ctx, args)

        // Check if the response was successful and update the entity
        // res.statusCode is set when res.status() is called
        // Only update if status code is explicitly 200
        if (res.statusCode === 200) {
          try {
            await updateFunction(ctx)
          } catch (error) {
            console.error('Error during update:', error)
            // Handle error as needed - don't fail the request
          }
        }
      } catch (error) {
        // If handler throws, re-throw it (don't update entity on error)
        // This allows Next.js to handle the error properly
        throw error
      }
    }
  }
}

export const withQuestionUpdate = withEntityUpdate(async (ctx) => {
  const { req, prisma } = ctx
  const { questionId } = req.query

  if (!questionId) {
    console.error('withQuestionUpdate: questionId not found in req.query')
    return
  }

  await prisma.question.update({
    where: { id: questionId },
    data: { updatedAt: new Date() },
  })
})

export const withEvaluationUpdate = withEntityUpdate(async (ctx) => {
  const { req, prisma } = ctx
  const { evaluationId } = req.query
  await prisma.evaluation.update({
    where: { id: evaluationId },
    data: { updatedAt: new Date() },
  })
})
