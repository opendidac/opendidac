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

/**
 * Code Replicator
 *
 * This replicator:
 *  - creates the base Question with type = code
 *  - creates the root Code relation
 *  - copies sandbox (if present)
 *  - copies codeWriting (test cases, template files, solution files)
 *  - copies codeReading (snippets)
 *
 * The base payload shape comes from QuestionCopyPayload.
 * We then augment the `code` relation locally for type convenience.
 */

import type { Prisma, Question } from '@prisma/client'
import type { BaseQuestionCreateData, QuestionCopyPayload } from '../base'
import { SELECT_CODE_MERGED_QUESTION } from '@/code/question/select/modules/officialAnswers'

import type { QuestionReplicator } from '.'

/**
 * Extract the properly-typed code relation from the merged literal structure.
 * The select structure is composed in the select modules, keeping schema details
 * out of the replicator code.
 */
type CodeRelationType = Prisma.QuestionGetPayload<{
  select: typeof SELECT_CODE_MERGED_QUESTION
}>['code']

/**
 * Payload type with properly-typed code relation.
 * Combines the base QuestionCopyPayload (which has all other fields correctly typed)
 * with our explicitly-typed code relation that preserves deep literal structure.
 */
type QuestionPayload = Omit<QuestionCopyPayload, 'code'> & {
  code: CodeRelationType | null
}

export const codeReplicator: QuestionReplicator<QuestionPayload> = {
  async replicate(
    prisma: Prisma.TransactionClient,
    sourceQuestion: QuestionPayload,
    commonFields: BaseQuestionCreateData,
  ): Promise<Question> {
    // Runtime + compile-time guard: we only support code questions here.
    if (!sourceQuestion.code) {
      throw new Error(
        'codeReplicator called with question that has no code relation',
      )
    }

    const c = sourceQuestion.code

    // -------------------------------------------------------------------------
    // Step 1: Create the question + code root
    // -------------------------------------------------------------------------
    const newQ = await prisma.question.create({
      data: {
        ...commonFields,
        code: {
          create: {
            language: c.language ?? null,
            codeType: c.codeType,
            sandbox: c.sandbox
              ? {
                  create: {
                    image: c.sandbox.image,
                    beforeAll: c.sandbox.beforeAll ?? null,
                  },
                }
              : undefined,
          },
        },
      },
    })

    // -------------------------------------------------------------------------
    // Step 2: CodeWriting
    // -------------------------------------------------------------------------
    if (c.codeWriting) {
      const cw = c.codeWriting

      await prisma.codeWriting.create({
        data: {
          questionId: newQ.id,
          codeCheckEnabled: cw.codeCheckEnabled ?? true,
          testCases:
            cw.testCases && cw.testCases.length
              ? {
                  create: cw.testCases.map((tc) => ({
                    index: tc.index,
                    exec: tc.exec,
                    input: tc.input,
                    expectedOutput: tc.expectedOutput,
                  })),
                }
              : undefined,
        },
      })

      // Template files
      for (const f of cw.templateFiles ?? []) {
        const file = await prisma.file.create({
          data: {
            questionId: newQ.id,
            path: f.file.path,
            content: f.file.content,
            createdAt: f.file.createdAt,
          },
        })

        await prisma.codeToTemplateFile.create({
          data: {
            questionId: newQ.id,
            fileId: file.id,
            order: f.order,
            studentPermission: f.studentPermission,
          },
        })
      }

      // Solution files
      for (const f of cw.solutionFiles ?? []) {
        const file = await prisma.file.create({
          data: {
            questionId: newQ.id,
            path: f.file.path,
            content: f.file.content,
            createdAt: f.file.createdAt,
          },
        })

        await prisma.codeToSolutionFile.create({
          data: {
            questionId: newQ.id,
            fileId: file.id,
            order: f.order,
          },
        })
      }
    }

    // -------------------------------------------------------------------------
    // Step 3: CodeReading
    // -------------------------------------------------------------------------
    if (c.codeReading) {
      const cr = c.codeReading

      await prisma.codeReading.create({
        data: {
          questionId: newQ.id,
          contextExec: cr.contextExec ?? null,
          contextPath: cr.contextPath ?? null,
          context: cr.context ?? null,
          studentOutputTest: cr.studentOutputTest ?? false,
          snippets:
            cr.snippets && cr.snippets.length
              ? {
                  create: cr.snippets.map((s) => ({
                    order: s.order,
                    snippet: s.snippet ?? null,
                    output: s.output ?? null,
                  })),
                }
              : undefined,
        },
      })
    }

    return newQ
  },
}
