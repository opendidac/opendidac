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
import {
  Role,
  QuestionType,
  QuestionSource,
  CodeQuestionType,
  QuestionStatus,
} from '@prisma/client'
import {
  withAuthorization,
  withGroupScope,
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { withPrisma } from '@/middleware/withPrisma'
import {
  codeInitialUpdateQuery,
  questionIncludeClause,
  questionTypeSpecific,
} from '@/code/questions'

import languages from '@/code/languages.json'
import databaseTemplate from '@/code/database.json'

const environments = languages.environments

/**
 * Managing the questions of a group
 *
 * get: list questions of a group (filter by title, content, tags, question types, code languages)
 * post: create a new question
 * del: delete a question
 *
 */

const get = async (req, res, prisma) => {
  let {
    groupScope,
    search,
    tags,
    questionTypes,
    codeLanguages,
    questionStatus,
  } = req.query

  questionTypes = questionTypes
    ? questionTypes.split(',').map((type) => QuestionType[type])
    : []
  codeLanguages = codeLanguages ? codeLanguages.split(',') : []

  tags = tags ? tags.split(',') : []

  // Set default status to ACTIVE if not provided, otherwise use the provided status
  const status = questionStatus || QuestionStatus.ACTIVE

  let where = {
    where: {
      group: {
        scope: groupScope,
      },
      source: {
        in: [QuestionSource.BANK, QuestionSource.COPY],
      },
      status: status,
      AND: [],
    },
  }

  // use AND for title and content
  if (search) {
    where.where.AND.push({
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ],
    })
  }

  if (tags.length > 0) {
    where.where.AND.push({
      AND: tags.map((tag) => ({
        questionToTag: {
          some: {
            label: {
              equals: tag,
              mode: 'insensitive',
            },
          },
        },
      })),
    })
  }

  const questionTypesWithoutCode = questionTypes.filter(
    (type) => type !== QuestionType.code,
  )

  if (questionTypes.includes(QuestionType.code) && codeLanguages.length > 0) {
    where.where.AND.push({
      OR: [
        {
          type: { in: questionTypesWithoutCode },
        },
        {
          AND: [
            { type: QuestionType.code },
            { code: { language: { in: codeLanguages } } },
          ],
        },
      ],
    })
  } else if (questionTypes.length > 0) {
    where.where.AND.push({
      type: { in: questionTypes },
    })
  }

  if (where.where.AND.length === 0) {
    delete where.where.AND
  }

  // console.log("where: ", util.inspect(where, {showHidden: false, depth: null}))

  const questions = await prisma.question.findMany({
    ...where,
    include: {
      ...questionIncludeClause({
        includeTypeSpecific: true,
        includeOfficialAnswers: true,
      }),
      evaluation: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  res.status(200).json(questions)
}

const post = async (req, res, prisma) => {
  // create a new question -> at this point we only know the question type
  const { groupScope } = req.query
  const { type, options } = req.body
  const questionType = QuestionType[type]

  if (!questionType) {
    res.status(400).json({ message: 'Invalid question type' })
    return
  }

  let createdQuestion = undefined

  await prisma.$transaction(async (prisma) => {
    createdQuestion = await prisma.question.create({
      data: {
        type: questionType,
        title: '',
        content: '',
        [questionType]: {
          create: questionTypeSpecific(questionType, null),
        },
        group: {
          connect: {
            scope: groupScope,
          },
        },
      },
      include: questionIncludeClause(true, true),
    })

    switch (questionType) {
      /* Code Question starting environment */
      case QuestionType.code: {
        const language = options?.language
        const codeQuestionType = options?.codeQuestionType
        const defaultCode = defaultCodeBasedOnLanguageAndType(
          language,
          codeQuestionType,
          options,
        )

        await prisma.code.update(
          codeInitialUpdateQuery(
            createdQuestion.id,
            defaultCode,
            codeQuestionType,
          ),
        )
        createdQuestion = await prisma.question.findUnique({
          where: {
            id: createdQuestion.id,
          },
          include: questionIncludeClause(true, true),
        })
        break
      }
      /* Database Question starting environment */
      case QuestionType.database: {
        // First update the database with the image and create queries
        await prisma.database.update({
          where: {
            questionId: createdQuestion.id,
          },
          data: {
            image: databaseTemplate.image,
            databaseQueries: {
              create: databaseTemplate.queries.map((query) => ({
                order: query.order,
                title: query.title,
                description: query.description,
                content: query.content,
                lintActive: query.lintActive,
                testQuery: query.testQuery,
                studentPermission: query.studentPermission,
                databaseToSolutionQuery: {
                  create: {
                    database: {
                      connect: {
                        questionId: createdQuestion.id,
                      },
                    },
                  },
                },
              })),
            },
          },
        })

        createdQuestion = await prisma.question.findUnique({
          where: {
            id: createdQuestion.id,
          },
          include: questionIncludeClause(true, true),
        })
        break
      }
      default:
        // No additional initialization needed for other question types
        break
    }
  })

  res.status(200).json(createdQuestion)
}

const defaultCodeBasedOnLanguageAndType = (
  language,
  codeQuestionType,
  options,
) => {
  const index = environments.findIndex((env) => env.language === language)
  const environment = environments[index]

  const data = {
    language: environment.language,
    sandbox: {
      image: environment.sandbox.image,
      beforeAll: environment.sandbox.beforeAll,
    },
  }

  if (codeQuestionType === CodeQuestionType.codeWriting) {
    const codeWriting = environment.codeWriting.find(
      (cw) => cw.value === options.codeWritingTemplate,
    )?.setup

    if (codeWriting.beforeAll) {
      data.sandbox.beforeAll = codeWriting.beforeAll
    }

    if (codeWriting.image) {
      data.sandbox.image = codeWriting.image
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
}

export default withGroupScope(
  withMethodHandler({
    GET: withAuthorization(withPrisma(get), [Role.PROFESSOR]),
    POST: withAuthorization(withPrisma(post), [Role.PROFESSOR]),
  }),
)
