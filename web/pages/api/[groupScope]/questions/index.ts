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

import { Role, QuestionType, CodeQuestionType, Prisma } from '@prisma/client'
import {
  withAuthorization,
  withGroupScope,
} from '@/middleware/withAuthorization'
import { withApiContext } from '@/middleware/withApiContext'
import type { IApiContext } from '@/types/api'
import { codeInitialUpdateQuery, questionTypeSpecific } from '@/code/questions'
import { questionsFilterWhereClause } from '@/code/questionsFilter'
import languages from '@/code/languages.json'
import databaseTemplate from '@/code/database.json'
import {
  SELECT_BASE_WITH_PROFESSOR_INFO,
  SELECT_TYPE_SPECIFIC,
  SELECT_OFFICIAL_ANSWERS,
  SELECT_QUESTION_TAGS,
} from '@/code/question/select'

/**
 * Select clause for professor listing questions.
 * Composed directly from module selects without exposing schema structure.
 * Includes: base fields (with professor info), type-specific data, tags.
 * Note: Does NOT include official answers (not needed for listing).
 */
const SELECT_FOR_PROFESSOR_LISTING = {
  lastUsed: true,
  usageStatus: true,
  evaluation: true,
  ...SELECT_BASE_WITH_PROFESSOR_INFO,
  ...SELECT_TYPE_SPECIFIC,
  ...SELECT_QUESTION_TAGS,
} as const satisfies Prisma.QuestionSelect

type ProfessorListingSelectPayload = Prisma.QuestionGetPayload<{
  select: typeof SELECT_FOR_PROFESSOR_LISTING
}>


/**
 * 
 * export function useProfessorQuestions() {
  const { data, error, isLoading } = useSWR<ProfessorListingSelectPayload[]>(
    "/api/professor/questions",
    fetcher
  );

  return {
    questions: data,
    isLoading,
    error,
  };
}
 */


const SELECT_FOR_PROFESSOR_EDITING = {
  ...SELECT_BASE_WITH_PROFESSOR_INFO,
  ...SELECT_TYPE_SPECIFIC,
  ...SELECT_OFFICIAL_ANSWERS,
  ...SELECT_QUESTION_TAGS,
} as const satisfies Prisma.QuestionSelect

const environments = languages.environments

/**
 * Managing the questions of a group
 *
 * get: list questions of a group (filter by title, content, tags, question types, code languages)
 * post: create a new question
 * del: delete a question
 *
 */

interface PostQuestionBody {
  type: string
  options?: {
    language?: string
    codeQuestionType?: CodeQuestionType
    codeWritingTemplate?: string
    tags?: string[]
  }
}

const get = async (ctx: IApiContext) => {
  const { req, res, prisma } = ctx
  const where = questionsFilterWhereClause(req.query)

  const questions = await prisma.question.findMany({
    ...where,
    select: SELECT_FOR_PROFESSOR_LISTING,
    orderBy: {
      createdAt: 'desc',
    },
  })

  res.status(200).json(questions as ProfessorListingSelectPayload[])
}

export const post = async (ctx: IApiContext) => {
  const { req, res, prisma } = ctx
  const { groupScope } = req.query
  const body = req.body as PostQuestionBody
  const { type, options } = body

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

  const fullSelect = SELECT_FOR_PROFESSOR_EDITING

  try {
    const createdQuestion = await prisma.$transaction(async (tx) => {
      // Fetch the group to get its id
      const group = await tx.group.findUnique({
        where: { scope: groupScope },
        select: { id: true },
      })
      if (!group) throw new Error('Group not found for scope: ' + groupScope)
      // 1) Create with the minimum we need for follow-up updates
      const created = await tx.question.create({
        data: {
          type: questionType,
          title: '',
          content: '',
          [questionType]: {
            create: questionTypeSpecific(questionType, null),
          },
          group: { connect: { scope: groupScope } },
        },
        select: { id: true }, // keep payload tiny; we'll fetch once at the end
      })

      // 2) Type-specific initialization
      switch (questionType) {
        case QuestionType.code: {
          const language = options?.language
          const codeQuestionType = options?.codeQuestionType
          const defaultCode = defaultCodeBasedOnLanguageAndType(
            language,
            codeQuestionType,
            options,
          )
          await tx.code.update(
            codeInitialUpdateQuery(created.id, defaultCode, codeQuestionType),
          )
          break
        }

        case QuestionType.database: {
          await tx.database.update({
            where: { questionId: created.id },
            data: {
              image: databaseTemplate.image,
              databaseQueries: {
                create: databaseTemplate.queries.map((q) => ({
                  order: q.order,
                  title: q.title,
                  description: q.description,
                  content: q.content,
                  lintActive: q.lintActive,
                  testQuery: q.testQuery,
                  studentPermission: q.studentPermission,
                  databaseToSolutionQuery: {
                    create: {
                      database: { connect: { questionId: created.id } },
                    },
                  },
                })),
              },
            },
          })
          break
        }

        default:
          // No additional initialization needed
          break
      }

      // 3) Tags initialization (if any)
      if (
        options?.tags &&
        Array.isArray(options.tags) &&
        options.tags.length > 0
      ) {
        await Promise.all(
          options.tags.map((tag) =>
            tx.questionToTag.create({
              data: {
                questionId: created.id,
                groupId: group.id,
                label: tag,
              },
            }),
          ),
        )
      }

      // 4) Single, final fetch with full INCLUDE
      return tx.question.findUnique({
        where: { id: created.id },
        select: fullSelect as Prisma.QuestionSelect,
      })
    })

    res.status(200).json(createdQuestion)
  } catch (err) {
    console.error('POST /question error:', err)
    res.status(500).json({ message: 'Failed to create question' })
  }
}

const defaultCodeBasedOnLanguageAndType = (
  language: string | undefined,
  codeQuestionType: CodeQuestionType | undefined,
  options: PostQuestionBody['options'],
) => {
  if (!language) {
    throw new Error('Language is required')
  }

  const index = environments.findIndex((env) => env.language === language)
  const environment = environments[index]

  if (!environment) {
    throw new Error(`Environment not found for language: ${language}`)
  }

  const data = {
    language: environment.language,
    sandbox: {
      image: environment.sandbox.image,
      beforeAll: environment.sandbox.beforeAll,
    },
  }

  if (codeQuestionType === CodeQuestionType.codeWriting) {
    const codeWriting = environment.codeWriting.find(
      (cw) => cw.value === options?.codeWritingTemplate,
    )?.setup

    if (!codeWriting) {
      throw new Error(
        `Code writing template not found: ${options?.codeWritingTemplate}`,
      )
    }

    if ('beforeAll' in codeWriting && codeWriting.beforeAll) {
      data.sandbox.beforeAll = codeWriting.beforeAll as string
    }

    if ('image' in codeWriting && codeWriting.image) {
      data.sandbox.image = codeWriting.image as string
    }

    return {
      ...data,
      files: codeWriting.files,
      testCases: codeWriting.testCases,
    }
  } else if (codeQuestionType === CodeQuestionType.codeReading) {
    return {
      ...data,
      contextExec: environment.sandbox.exec,
      contextPath: environment.sandbox.defaultPath,
      context: environment.codeReading.context,
      snippets: environment.codeReading.snippets,
    }
  }

  return data
}

export default withApiContext({
  GET: withGroupScope(withAuthorization(get, { roles: [Role.PROFESSOR] })),
  POST: withGroupScope(withAuthorization(post, { roles: [Role.PROFESSOR] })),
})
