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

function withEntityUpdate(updateFunction) {
  const prisma = getPrisma()

  return function (handler) {
    return async (req, res) => {
      // Wrap the original response.send function
      const originalSend = res.send.bind(res)

      // Replace the res.send function with custom logic
      res.send = async function (...args) {
        // Call the original send function to send the response
        originalSend(...args)

        // Check if the response was successful
        if (res.statusCode === 200) {
          // Execute the update function passed as an argument
          try {
            await updateFunction(req, prisma)
          } catch (error) {
            console.error('Error during update:', error)
            // Handle error as needed
          }
        }
      }

      // Execute the original handler
      await handler(req, res, prisma)
    }
  }
}

export const withQuestionUpdate = withEntityUpdate(async (req, prisma) => {
  const { questionId } = req.query
  await prisma.question.update({
    where: { id: questionId },
    data: { updatedAt: new Date() },
  })
})

export const withCollectionUpdate = withEntityUpdate(async (req, prisma) => {
  const { collectionId } = req.query
  await prisma.collection.update({
    where: { id: collectionId },
    data: { updatedAt: new Date() },
  })
})

export const withEvaluationUpdate = withEntityUpdate(async (req, prisma) => {
  const { evaluationId } = req.query
  await prisma.evaluation.update({
    where: { id: evaluationId },
    data: { updatedAt: new Date() },
  })
})
