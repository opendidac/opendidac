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
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { withPrisma } from '@/middleware/withPrisma'

/**
 * Import multiple questions from OpenDidac question format
 *
 * POST /api/[groupScope]/questions/import
 *
 * Request Body:
 * {
 *   "questions": [
 *     {
 *       "schema": "opendidac.question@1",
 *       "type": "multipleChoice",
 *       "title": "Question Title",
 *       "content": "Question content...",
 *       "data": {
 *         "gradingPolicy": "GRADUAL_CREDIT",
 *         "options": [...]
 *       }
 *     },
 *     ...
 *   ]
 * }
 *
 * OR (exported format with meta):
 * {
 *   "questions": [...],
 *   "meta": {
 *     "count": 3,
 *     "schema": "opendidac.questions@1"
 *   }
 * }
 *
 * Response:
 * {
 *   "imported": [
 *     {
 *       "id": "clr123abc",
 *       "title": "Question Title",
 *       "type": "multipleChoice"
 *     },
 *     ...
 *   ],
 *   "meta": {
 *     "count": 3,
 *     "successful": 3,
 *     "failed": 0
 *   }
 * }
 *
 * Error responses:
 * - 400: Invalid request body or question format
 * - 500: Internal server error during import process
 */

const post = async (req, res, prisma) => {
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
    const errors = []

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
            originalIndex: i,
          })
        } catch (error) {
          console.error(`Error importing question ${i + 1}:`, error)
          errors.push({
            index: i + 1,
            title: questionJson?.title || 'Unknown',
            error: error.message,
          })

          // Re-throw to rollback the entire transaction
          throw new Error(
            `Failed to import question ${i + 1} (${questionJson?.title || 'Unknown'}): ${error.message}`,
          )
        }
      }
    })

    // If we get here, all questions were imported successfully
    res.status(200).json({
      imported: importedQuestions.map((q) => ({
        id: q.id,
        title: q.title,
        type: q.type,
      })),
      meta: {
        count: importedQuestions.length,
        successful: importedQuestions.length,
        failed: 0,
      },
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
      meta: {
        attempted: questionsToImport.length,
        successful: 0,
        failed: questionsToImport.length,
      },
    })
  }
}

export default withGroupScope(
  withMethodHandler({
    POST: withAuthorization(withPrisma(post), [Role.PROFESSOR]),
  }),
)
