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
  QuestionType,
  StudentPermission,
  CodeQuestionType,
} from '@prisma/client'
import { questionIncludeClause } from './questions'

// #### Question import / export ####

/* --------------------- utilities --------------------- */

/**
 * Recursively remove null/undefined and empty objects/arrays.
 * Keeps the exported JSON minimal and clean.
 */
const stripEmpty = (x) => {
  if (Array.isArray(x)) {
    const arr = x.map(stripEmpty).filter((v) => v !== undefined)
    return arr.length ? arr : undefined
  }
  if (x && typeof x === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(x)) {
      const vv = stripEmpty(v)
      if (vv !== undefined && !(Array.isArray(vv) && vv.length === 0))
        out[k] = vv
    }
    return Object.keys(out).length ? out : undefined
  }
  return x === null || x === undefined ? undefined : x
}

/* ----------------- prisma query builders ----------------- */

/**
 * Build ONLY the Prisma query shape for a given questionId.
 * No DB calls here — safe to unit-test and reuse.
 */
export const buildExportPrismaQuery = (questionId) => ({
  where: { id: questionId },
  include: questionIncludeClause({
    includeTypeSpecific: true,
    includeOfficialAnswers: true,
    includeUserAnswers: undefined,
    includeGradings: false,
    includeTags: false,
  }),
})

/**
 * Execute a previously-built Prisma query.
 * Keeps I/O in one place.
 */
export const runExportQuery = async (client, query) => {
  const q = await client.question.findUnique(query)
  if (!q)
    throw new Error(`Question not found: ${query.where?.id || 'unknown id'}`)
  return q
}

/* --------------- type-specific serializers --------------- */

const exportMultipleChoice = (mc) => {
  if (!mc) return {}
  return {
    gradingPolicy: mc.gradingPolicy,
    activateStudentComment: mc.activateStudentComment,
    studentCommentLabel: mc.studentCommentLabel ?? null,
    selectionLimit: mc.activateSelectionLimit ? mc.selectionLimit ?? 0 : 0,
    options: (mc.options || []).map((o) => ({
      order: o.order,
      text: o.text ?? null,
      isCorrect: o.isCorrect,
    })),
  }
}

const exportTrueFalse = (tf) => ({ isTrue: tf?.isTrue ?? null })

const exportEssay = (essay) => ({
  solution: essay?.solution ?? null,
  template: essay?.template ?? null,
})

const exportCodeWriting = (cw) => {
  if (!cw) return {}
  return {
    templateFiles: (cw.templateFiles || []).map((tf) => ({
      path: tf.file.path,
      content: tf.file.content,
      studentPermission: tf.studentPermission,
    })),
    solutionFiles: (cw.solutionFiles || []).map((sf) => ({
      path: sf.file.path,
      content: sf.file.content,
    })),
    testCases: (cw.testCases || []).map((t) => ({
      index: t.index,
      exec: t.exec,
      input: t.input,
      expectedOutput: t.expectedOutput,
    })),
  }
}

const exportCodeReading = (cr) => {
  if (!cr) return {}
  return {
    studentOutputTest: cr.studentOutputTest,
    contextExec: cr.contextExec ?? null,
    contextPath: cr.contextPath ?? null,
    context: cr.context ?? null,
    snippets: (cr.snippets || []).map((s) => ({
      order: s.order,
      snippet: s.snippet ?? null,
      output: s.output ?? null,
    })),
  }
}

const exportCode = (code) => {
  if (!code) return {}
  const common = {
    codeType: code.codeType,
    language: code.language ?? null,
    sandbox: code.sandbox
      ? { image: code.sandbox.image, beforeAll: code.sandbox.beforeAll ?? null }
      : null,
  }
  if (code.codeType === 'codeWriting')
    return { ...common, ...exportCodeWriting(code.codeWriting) }
  if (code.codeType === 'codeReading')
    return { ...common, ...exportCodeReading(code.codeReading) }
  return common
}

const exportDatabase = (db) => {
  if (!db) return {}
  return {
    image: db.image ?? null,
    solutionQueries: (db.solutionQueries || []).map((sq) => ({
      order: sq.query.order,
      title: sq.query.title ?? null,
      description: sq.query.description ?? null,
      lintActive: sq.query.lintActive,
      lintRules: sq.query.lintRules ?? null,
      content: sq.query.content ?? null,
      template: sq.query.template ?? null,
      testQuery: sq.query.testQuery,
      expectedOutputType: sq.output?.type ?? null,
    })),
  }
}

const exportWeb = (w) => {
  if (!w) return {}
  return {
    templateHtml: w.templateHtml ?? null,
    templateCss: w.templateCss ?? null,
    templateJs: w.templateJs ?? null,
    solutionHtml: w.solutionHtml ?? null,
    solutionCss: w.solutionCss ?? null,
    solutionJs: w.solutionJs ?? null,
  }
}

const exportExactMatch = (em) => {
  if (!em) return {}
  return {
    fields: (em.fields ?? []).map((field) => ({
      order: field.order,
      statement: field.statement,
      matchRegex: field.matchRegex,
    })),
  }
}

/* ------------------- serialization core ------------------- */

/**
 * Convert the hydrated DB question into the minimal export JSON.
 * Pure function — no DB access here.
 */
export const serializeQuestion = (q) => {
  let data = {}

  switch (q.type) {
    case QuestionType.multipleChoice:
      data = exportMultipleChoice(q.multipleChoice)
      break
    case QuestionType.trueFalse:
      data = exportTrueFalse(q.trueFalse)
      break
    case QuestionType.essay:
      data = exportEssay(q.essay)
      break
    case QuestionType.code:
      data = exportCode(q.code)
      break
    case QuestionType.database:
      data = exportDatabase(q.database)
      break
    case QuestionType.web:
      data = exportWeb(q.web)
      break
    case QuestionType.exactMatch:
      data = exportExactMatch(q.exactMatch)
      break
    default:
      data = {}
  }

  const payload = stripEmpty({
    type: q.type,
    title: q.title,
    content: q.content ?? null,
    data,
  })

  return {
    type: payload.type,
    title: payload.title,
    ...(payload.content ? { content: payload.content } : {}),
    data: payload.data || {},
  }
}

/* ---------------- convenience orchestrator ---------------- */

/**
 * Full export pipeline:
 *   1) build query
 *   2) run prisma
 *   3) serialize to minimal JSON
 */
export const exportQuestion = async (questionId, prisma) => {
  const query = buildExportPrismaQuery(questionId)
  const dbQuestion = await runExportQuery(prisma, query)
  return serializeQuestion(dbQuestion)
}

/* ========================= IMPORT FUNCTIONALITY ========================= */

/**
 * Normalize falsy strings to null so we don't store empty strings everywhere.
 */
const nn = (v) => (v === '' || v === undefined ? null : v)

/* --------------------- per-type builders (nested create) --------------------- */
/**
 * These functions produce the nested `create` payloads for Prisma.
 * They return ONLY what can be created in the initial `question.create`.
 * Anything that requires the new questionId (e.g., Files + link tables, DB solution mapping)
 * is returned via the post-plan (see bottom).
 */

const buildMultipleChoiceCreate = (data) => ({
  create: {
    gradingPolicy: data.gradingPolicy,
    activateStudentComment: !!data.activateStudentComment,
    studentCommentLabel: nn(data.studentCommentLabel),
    activateSelectionLimit: !!(data.selectionLimit && data.selectionLimit > 0),
    selectionLimit: data.selectionLimit ?? 0,
    options: data.options?.length
      ? {
          create: data.options.map((o) => ({
            order: o.order ?? 0,
            text: nn(o.text),
            isCorrect: !!o.isCorrect,
          })),
        }
      : undefined,
  },
})

const buildTrueFalseCreate = (data) => ({
  create: {
    isTrue: data?.isTrue ?? null,
  },
})

const buildEssayCreate = (data) => ({
  create: {
    solution: nn(data?.solution),
    template: nn(data?.template),
  },
})

const buildCodeCreate = (data) => {
  const common = {
    language: nn(data.language),
    codeType: data.codeType || CodeQuestionType.codeWriting,
    sandbox: data.sandbox
      ? {
          create: {
            image: data.sandbox.image,
            beforeAll: nn(data.sandbox.beforeAll),
          },
        }
      : undefined,
  }

  if (common.codeType === CodeQuestionType.codeWriting) {
    return {
      create: {
        ...common,
        codeWriting: {
          create: {
            codeCheckEnabled: true,
            // test cases can be created inline
            testCases: data.testCases?.length
              ? {
                  create: data.testCases.map((t, i) => ({
                    index: t.index ?? i + 1,
                    exec: t.exec || '',
                    input: t.input || '',
                    expectedOutput: t.expectedOutput || '',
                  })),
                }
              : undefined,
          },
        },
      },
    }
  } else {
    // codeReading
    return {
      create: {
        ...common,
        codeReading: {
          create: {
            studentOutputTest: !!data.studentOutputTest,
            contextExec: nn(data.contextExec),
            contextPath: nn(data.contextPath),
            context: nn(data.context),
            snippets: data.snippets?.length
              ? {
                  create: data.snippets.map((s, idx) => ({
                    order: s.order ?? idx,
                    snippet: nn(s.snippet),
                    output: nn(s.output),
                  })),
                }
              : undefined,
          },
        },
      },
    }
  }
}

const buildDatabaseCreate = (data) => ({
  create: {
    image: nn(data.image),
    // DO NOT try to create solutionQueries now; we don't yet have the created query IDs.
    // We'll create the queries and link them later in runImportPost().
  },
})

const buildWebCreate = (data) => ({
  create: {
    templateHtml: nn(data.templateHtml),
    templateCss: nn(data.templateCss),
    templateJs: nn(data.templateJs),
    solutionHtml: nn(data.solutionHtml),
    solutionCss: nn(data.solutionCss),
    solutionJs: nn(data.solutionJs),
  },
})

const buildExactMatchCreate = (data) => ({
  create: {
    fields: data.fields?.length
      ? {
          create: data.fields.map((field) => ({
            order: field.order ?? 0,
            statement: nn(field.statement),
            matchRegex: nn(field.matchRegex),
          })),
        }
      : undefined,
  },
})

/* ----------------------- import query builder (no I/O) ----------------------- */
/**
 * Build ONLY the Prisma `.create()` data for a question, and a post-plan
 * describing follow-up operations that require the created questionId.
 *
 * @param {Object} questionJson - One question in minimal export format
 * @param {Object} group - group reference. Pass either { id } or { label } (if you resolve by label elsewhere)
 * @returns {{ createData: object, post: object }}
 */
export const buildImportPrismaQuery = (questionJson, group) => {
  const { type, title, content, data } = questionJson
  const connectGroup = group?.id
    ? { connect: { id: group.id } }
    : group?.label
      ? { connect: { label: group.label } } // only if you have a unique on label; otherwise resolve label → id upstream
      : null

  // Core create data for prisma.question.create
  let typeSpecificCreate
  switch (type) {
    case QuestionType.multipleChoice:
      typeSpecificCreate = buildMultipleChoiceCreate(data)
      break
    case QuestionType.trueFalse:
      typeSpecificCreate = buildTrueFalseCreate(data)
      break
    case QuestionType.essay:
      typeSpecificCreate = buildEssayCreate(data)
      break
    case QuestionType.code:
      typeSpecificCreate = buildCodeCreate(data)
      break
    case QuestionType.database:
      typeSpecificCreate = buildDatabaseCreate(data)
      break
    case QuestionType.web:
      typeSpecificCreate = buildWebCreate(data)
      break
    case QuestionType.exactMatch:
      typeSpecificCreate = buildExactMatchCreate(data)
      break
    default:
      typeSpecificCreate = undefined
  }

  const createData = {
    data: {
      title: title || '',
      content: nn(content),
      type,
      ...(connectGroup ? { group: connectGroup } : {}),
      // type-specific nested create
      ...(typeSpecificCreate ? { [type]: typeSpecificCreate } : {}),
    },
  }

  /**
   * Post-plan: things we cannot do in a single nested create because we need
   * the new questionId (and/or created children IDs).
   *
   * - codeWriting.files: create File rows and link via CodeToTemplateFile / CodeToSolutionFile
   * - database.solutionQueries: connect solution entries to authoring queries by `order`
   */
  const post = {
    codeFiles: undefined,
    dbSolution: undefined,
  }

  if (
    type === QuestionType.code &&
    data?.codeType === CodeQuestionType.codeWriting
  ) {
    const templateFiles = (data.templateFiles || []).map((f, index) => ({
      order: index,
      path: f.path,
      content: f.content,
      studentPermission: f.studentPermission || StudentPermission.UPDATE,
    }))
    const solutionFiles = (data.solutionFiles || []).map((f, index) => ({
      order: index,
      path: f.path,
      content: f.content,
      // CodeToSolutionFile has no studentPermission column in your schema; ignoring here
    }))
    post.codeFiles = { templateFiles, solutionFiles }
  }

  if (
    type === QuestionType.database &&
    Array.isArray(data?.solutionQueries) &&
    data.solutionQueries.length
  ) {
    // We need to create the queries and then link them as solution queries
    post.dbSolution = {
      queries: data.solutionQueries.map((sq) => ({
        order: sq.order ?? 0,
        title: nn(sq.title),
        description: nn(sq.description),
        lintActive: !!sq.lintActive,
        lintRules: sq.lintRules ?? null,
        content: nn(sq.content),
        template: nn(sq.template),
        testQuery: !!sq.testQuery,
        expectedOutputType: sq.expectedOutputType ?? null,
      })),
    }
  }

  return { createData, post }
}

/* --------------------------- import executors (I/O) -------------------------- */

/**
 * Execute the primary create.
 * @returns {Promise<Question>} the created question (with its id)
 */
export const runImportCreate = async (prisma, createData) => {
  // Return the created question with minimal fields needed by post steps
  const created = await prisma.question.create({
    ...createData,
    select: { id: true, type: true },
  })
  return created
}

/**
 * Execute follow-up operations that require the created questionId.
 * - Create Files and link to codeWriting
 * - Link database solution queries by query order
 */
export const runImportPost = async (prisma, createdQuestion, postPlan) => {
  if (!postPlan) return createdQuestion

  // 1) Code files (template + solution) for codeWriting
  if (postPlan.codeFiles) {
    const { templateFiles, solutionFiles } = postPlan.codeFiles

    // Create each file and link via the join tables, preserving orders/permissions
    for (const tf of templateFiles) {
      const newFile = await prisma.file.create({
        data: {
          path: tf.path,
          content: tf.content,
          code: { connect: { questionId: createdQuestion.id } }, // File requires CodeWriting via questionId
        },
        select: { id: true },
      })
      await prisma.codeToTemplateFile.create({
        data: {
          questionId: createdQuestion.id,
          fileId: newFile.id,
          order: tf.order,
          studentPermission: tf.studentPermission || StudentPermission.UPDATE,
        },
      })
    }

    for (const sf of solutionFiles) {
      const newFile = await prisma.file.create({
        data: {
          path: sf.path,
          content: sf.content,
          code: { connect: { questionId: createdQuestion.id } },
        },
        select: { id: true },
      })
      await prisma.codeToSolutionFile.create({
        data: {
          questionId: createdQuestion.id,
          fileId: newFile.id,
          order: sf.order,
        },
      })
    }
  }

  // 2) Database solution queries
  if (postPlan.dbSolution && Array.isArray(postPlan.dbSolution.queries)) {
    // Create each query and immediately link it as a solution query
    for (const queryData of postPlan.dbSolution.queries) {
      const { expectedOutputType, ...queryFields } = queryData

      // Create the database query
      const newQuery = await prisma.databaseQuery.create({
        data: queryFields,
        select: { id: true },
      })

      // Link it as a solution query
      await prisma.databaseToSolutionQuery.create({
        data: {
          questionId: createdQuestion.id,
          queryId: newQuery.id,
          // If you decide to also create a DatabaseQueryOutput, do it here and set outputId.
        },
      })
    }
  }

  return createdQuestion
}

/* ---------------------------- convenience wrapper ---------------------------- */

/**
 * One-call import:
 *   1) Build create data + post plan
 *   2) Run create
 *   3) Run post steps
 * Returns the created question id.
 */
export const importQuestion = async (prisma, questionJson, group) => {
  const { createData, post } = buildImportPrismaQuery(questionJson, group)
  const created = await runImportCreate(prisma, createData)
  await runImportPost(prisma, created, post)
  return created.id
}
