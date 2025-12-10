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
 * Database Replicator
 */

import type { Prisma, Question, DatabaseQueryOutputTest } from '@prisma/client'
import type { BaseQuestionCreateData, QuestionCopyPayload } from '../base'
import { SELECT_DATABASE_MERGED_QUESTION } from '@/core/question/select/modules/officialAnswers'

import type { QuestionReplicator } from '.'

/**
 * Extract the properly-typed database relation from the merged literal structure.
 * The select structure is composed in the select modules, keeping schema details
 * out of the replicator code.
 */
type DatabaseRelationType = Prisma.QuestionGetPayload<{
  select: typeof SELECT_DATABASE_MERGED_QUESTION
}>['database']

/**
 * Payload type with properly-typed database relation.
 * Combines the base QuestionCopyPayload (which has all other fields correctly typed)
 * with our explicitly-typed database relation that preserves deep literal structure.
 */
export type DBCopyPayload = Omit<QuestionCopyPayload, 'database'> & {
  database: DatabaseRelationType | null
}

export const databaseReplicator: QuestionReplicator<DBCopyPayload> = {
  async replicate(
    prisma: Prisma.TransactionClient,
    sourceQuestion: DBCopyPayload,
    commonFields: BaseQuestionCreateData,
  ): Promise<Question> {
    const db = sourceQuestion.database

    if (!db) {
      throw new Error(
        'databaseReplicator called with question that has no database relation',
      )
    }

    const newQ = await prisma.question.create({
      data: {
        ...commonFields,
        database: {
          create: {
            image: db.image ?? '',
          },
        },
      },
    })

    // Create queries + outputs
    for (const sq of db.solutionQueries ?? []) {
      const qData = sq.query
      const out = sq.output

      // queryOutputTests is included via include: { query: true }, but TypeScript
      // doesn't infer nested relations. We use type assertion since the data is present at runtime.
      const queryWithTests = qData as typeof qData & {
        queryOutputTests?: Array<{ test: DatabaseQueryOutputTest }>
      }

      const newQuery = await prisma.databaseQuery.create({
        data: {
          questionId: newQ.id,
          order: qData.order,
          title: qData.title ?? null,
          description: qData.description ?? null,
          content: qData.content ?? null,
          template: qData.template ?? null,

          lintActive: qData.lintActive ?? false,
          lintRules: qData.lintRules ?? null,

          studentPermission: qData.studentPermission,
          testQuery: qData.testQuery ?? false,

          queryOutputTests:
            queryWithTests.queryOutputTests &&
            queryWithTests.queryOutputTests.length > 0
              ? {
                  create: queryWithTests.queryOutputTests.map((t) => ({
                    test: t.test,
                  })),
                }
              : undefined,
        },
      })

      let newOutput = null

      if (out) {
        newOutput = await prisma.databaseQueryOutput.create({
          data: {
            queryId: newQuery.id,
            output: out.output as Prisma.InputJsonValue,
            status: out.status,
            type: out.type,
            dbms: out.dbms,
          },
        })
      }

      await prisma.databaseToSolutionQuery.create({
        data: {
          questionId: newQ.id,
          queryId: newQuery.id,
          outputId: newOutput?.id ?? null,
        },
      })
    }

    return newQ
  },
}
