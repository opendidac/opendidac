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

import { Role, QuestionType, CodeQuestionType } from '@prisma/client'
import type { NextApiRequest, NextApiResponse } from 'next'
import {
  withAuthorization,
  withGroupScope,
} from '@/middleware/withAuthorization'
import { withApiContext } from '@/middleware/withApiContext'
import type { IApiContext, ApiResponse } from '@/core/types/api'

import { questionsFilterWhereClause } from '@/core/questionsFilter'
import { codeInitialUpdateQuery, questionTypeSpecific } from '@/core/questions'

import languages from '@/core/languages.json'
import databaseTemplate from '@/core/database.json'

// ---------- IMPORT VIEW SELECTS + PAYLOAD TYPES ----------
import {
  SELECT_FOR_PROFESSOR_LISTING,
  type ProfessorQuestionListingPayload,
} from '@/api-types/[groupScope]/questions/index'

const get = async (
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ProfessorQuestionListingPayload[]>>,
  ctx: IApiContext,
) => {
  const { prisma } = ctx

  const where = questionsFilterWhereClause(req.query)

  const questions = await prisma.question.findMany({
    ...where,
    select: SELECT_FOR_PROFESSOR_LISTING,
    orderBy: { createdAt: 'desc' },
  })

  res.status(200).json(questions)
}

// ----------------------------------------------------------
// POST /api/[groupScope]/questions
// ----------------------------------------------------------

const post = async (
  req: NextApiRequest,
  res: NextApiResponse,
  ctx: IApiContext,
) => {
  const { prisma } = ctx
  const { groupScope } = req.query

  const body = req.body ?? {}
  const type = body.type as string | undefined

  const options = (body.options ?? {}) as {
    language?: string
    codeQuestionType?: CodeQuestionType
    codeWritingTemplate?: string
    tags?: string[]
  }

  // -------------------------
  // INPUT VALIDATION
  // -------------------------

  if (!type) {
    return res.status(400).json({ message: 'Invalid question type' })
  }

  const questionType = QuestionType[type as keyof typeof QuestionType]
  if (!questionType) {
    return res.status(400).json({ message: 'Invalid question type' })
  }

  if (!groupScope || typeof groupScope !== 'string') {
    return res.status(400).json({ message: 'Missing groupScope' })
  }

  // -------------------------
  // TRANSACTION
  // -------------------------

  try {
    const created = await prisma.$transaction(async (tx) => {
      // 1) Fetch group
      const group = await tx.group.findUnique({
        where: { scope: groupScope },
        select: { id: true },
      })

      if (!group) {
        throw new Error('Group not found: ' + groupScope)
      }

      // 2) Create base question
      const q = await tx.question.create({
        data: {
          type: questionType,
          title: '',
          content: '',
          [questionType]: {
            create: questionTypeSpecific(questionType, null),
          },
          group: { connect: { scope: groupScope } },
        },
        select: { id: true },
      })

      // 3) Type-specific initialization
      if (questionType === QuestionType.code) {
        const def = defaultCodeBasedOnLanguageAndType(
          options.language,
          options.codeQuestionType,
          options,
        )

        await tx.code.update(
          codeInitialUpdateQuery(q.id, def, options.codeQuestionType),
        )
      }

      if (questionType === QuestionType.database) {
        await tx.database.update({
          where: { questionId: q.id },
          data: {
            image: databaseTemplate.image,
            databaseQueries: {
              create: databaseTemplate.queries.map((queryTemplate) => ({
                order: queryTemplate.order,
                title: queryTemplate.title,
                description: queryTemplate.description,
                content: queryTemplate.content,
                lintActive: queryTemplate.lintActive,
                testQuery: queryTemplate.testQuery,
                studentPermission: queryTemplate.studentPermission,
                databaseToSolutionQuery: {
                  create: { database: { connect: { questionId: q.id } } },
                },
              })),
            },
          },
        })
      }

      // 4) Tags
      if (options.tags?.length) {
        await Promise.all(
          options.tags.map((label) =>
            tx.questionToTag.create({
              data: { questionId: q.id, groupId: group.id, label },
            }),
          ),
        )
      }

      // 5) Return just the ID - frontend only needs it for navigation
      return { id: q.id }
    })

    // SUCCESS RESPONSE
    return res.status(200).json(created)
  } catch (err) {
    console.error('POST /question error:', err)
    return res.status(500).json({
      status: 500,
      message: 'Failed to create question',
    })
  }
}

// ----------------------------------------------------------
// EXPORT ROUTE
// ----------------------------------------------------------

export default withApiContext({
  GET: withGroupScope(withAuthorization(get, { roles: [Role.PROFESSOR] })),
  POST: withGroupScope(withAuthorization(post, { roles: [Role.PROFESSOR] })),
})

// ----------------------------------------------------------
// To create a default code question based on the template (starting point for the code question)
// ----------------------------------------------------------

function defaultCodeBasedOnLanguageAndType(
  language: string | undefined,
  codeQuestionType: CodeQuestionType | undefined,
  options: {
    language?: string
    codeQuestionType?: CodeQuestionType
    codeWritingTemplate?: string
    tags?: string[]
  },
) {
  if (!language) throw new Error('Language is required')

  const env = languages.environments.find((e) => e.language === language)
  if (!env) throw new Error('Environment not found: ' + language)

  const base = {
    language: env.language,
    sandbox: {
      image: env.sandbox.image,
      beforeAll: env.sandbox.beforeAll,
    },
  }

  if (codeQuestionType === CodeQuestionType.codeWriting) {
    const tpl = env.codeWriting.find(
      (cw) => cw.value === options.codeWritingTemplate,
    )?.setup
    if (!tpl) throw new Error('Invalid codeWriting template')

    return {
      ...base,
      files: tpl.files,
      testCases: tpl.testCases,
    }
  }

  if (codeQuestionType === CodeQuestionType.codeReading) {
    return {
      ...base,
      contextExec: env.sandbox.exec,
      contextPath: env.sandbox.defaultPath,
      context: env.codeReading.context,
      snippets: env.codeReading.snippets,
    }
  }

  return base
}
