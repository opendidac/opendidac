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
import { exportQuestion } from '@/code/questionsImportExport'
import {
  withAuthorization,
  withGroupScope,
} from '@/middleware/withAuthorization'
import { withMethodHandler } from '@/middleware/withMethodHandler'
import { withPrisma } from '@/middleware/withPrisma'

const post = async (ctx) => {
  const { req, res, prisma } = ctx
  const { groupScope } = req.query
  const { questionIds } = req.body

  // Validate input
  if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
    return res.status(400).json({
      error: 'questionIds must be a non-empty array of strings',
    })
  }

  try {
    // First, verify all questions exist and belong to the group scope
    const questions = await prisma.question.findMany({
      where: {
        id: { in: questionIds },
        group: { scope: groupScope },
      },
      select: { id: true, title: true },
    })

    const foundIds = questions.map((q) => q.id)
    const missingIds = questionIds.filter((id) => !foundIds.includes(id))

    if (missingIds.length > 0) {
      return res.status(404).json({
        error: `Questions not found or not accessible in group scope: ${missingIds.join(', ')}`,
      })
    }

    // Export each question in the order they were requested
    const exportedQuestions = []
    for (const questionId of questionIds) {
      try {
        const exportedQuestion = await exportQuestion(questionId, prisma)
        exportedQuestions.push(exportedQuestion)
      } catch (error) {
        console.error(`Error exporting question ${questionId}:`, error)
        return res.status(500).json({
          error: `Failed to export question ${questionId}: ${error.message}`,
        })
      }
    }

    res.status(200).json({
      questions: exportedQuestions,
    })
  } catch (error) {
    console.error('Error in bulk question export:', error)
    res.status(500).json({
      error: 'Internal server error during question export',
    })
  }
}

export default withMethodHandler({
  POST: withGroupScope(
    withAuthorization(withPrisma(post), { roles: [Role.PROFESSOR] }),
  ),
})
