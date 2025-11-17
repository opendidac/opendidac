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
import { importQuestion } from '@/code/questionsImportExport'
import {
  withAuthorization,
  withGroupScope,
} from '@/middleware/withAuthorization'
import { withMethodHandler } from '@/middleware/withMethodHandler'
import { withPrisma } from '@/middleware/withPrisma'

const post = async (ctx) => {
  const { req, res, prisma } = ctx
  const { groupScope } = req.query
  const requestBody = req.body

  // Validate input and extract questions array
  let questionsToImport = []

  if (Array.isArray(requestBody)) {
    // Direct array of questions
    questionsToImport = requestBody
  } else if (requestBody.questions && Array.isArray(requestBody.questions)) {
    // Exported format with questions array
    questionsToImport = requestBody.questions
  } else {
    return res.status(400).json({
      error:
        'Request body must contain a "questions" array or be an array of questions',
    })
  }

  if (questionsToImport.length === 0) {
    return res.status(400).json({
      error: 'No questions provided for import',
    })
  }

  // Validate that we have a valid group
  const group = await prisma.group.findUnique({
    where: { scope: groupScope },
    select: { id: true, label: true },
  })

  if (!group) {
    return res.status(404).json({
      error: `Group not found: ${groupScope}`,
    })
  }

  try {
    const importedQuestions = []

    // Import all questions in a single transaction
    await prisma.$transaction(async (prismaTransaction) => {
      for (let i = 0; i < questionsToImport.length; i++) {
        const questionJson = questionsToImport[i]

        try {
          // Import the question using the existing importQuestion function
          const createdQuestionId = await importQuestion(
            prismaTransaction,
            questionJson,
            group,
          )

          importedQuestions.push({
            id: createdQuestionId,
            title: questionJson.title,
            type: questionJson.type,
          })
        } catch (error) {
          console.error(`Error importing question ${i + 1}:`, error)

          // Re-throw to rollback the entire transaction
          throw new Error(
            `Failed to import question ${i + 1} (${questionJson?.title || 'Unknown'}): ${error.message}`,
          )
        }
      }
    })

    // If we get here, all questions were imported successfully
    res.status(200).json({
      imported: importedQuestions,
      count: importedQuestions.length,
    })
  } catch (error) {
    console.error('Error in bulk question import:', error)

    // Extract useful error message
    let errorMessage = error.message
    if (errorMessage.includes('Failed to import question')) {
      // Use the specific error message from the transaction
      errorMessage = error.message
    } else {
      errorMessage = 'Internal server error during question import'
    }

    res.status(500).json({
      error: errorMessage,
    })
  }
}

export default withMethodHandler({
  POST: withGroupScope(
    withAuthorization(withPrisma(post), { roles: [Role.PROFESSOR] }),
  ),
})
