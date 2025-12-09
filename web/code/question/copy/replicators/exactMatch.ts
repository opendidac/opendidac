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
 * ExactMatch Replicator
 */

import type { Prisma, Question } from '@prisma/client'
import type { BaseQuestionCreateData, QuestionCopyPayload } from '../base'
import { SELECT_EXACT_MATCH_MERGED_QUESTION } from '@/code/question/select/modules/officialAnswers'

import type { QuestionReplicator } from '.'

/**
 * Extract the properly-typed exactMatch relation from the merged literal structure.
 * The select structure is composed in the select modules, keeping schema details
 * out of the replicator code.
 */
type ExactMatchRelationType = Prisma.QuestionGetPayload<{
  select: typeof SELECT_EXACT_MATCH_MERGED_QUESTION
}>['exactMatch']

/**
 * Payload type with properly-typed exactMatch relation.
 * Combines the base QuestionCopyPayload (which has all other fields correctly typed)
 * with our explicitly-typed exactMatch relation that preserves deep literal structure.
 */
export type ExactCopyPayload = Omit<QuestionCopyPayload, 'exactMatch'> & {
  exactMatch: ExactMatchRelationType | null
}

export const exactMatchReplicator: QuestionReplicator<ExactCopyPayload> = {
  async replicate(
    prisma: Prisma.TransactionClient,
    sourceQuestion: ExactCopyPayload,
    commonFields: BaseQuestionCreateData,
  ): Promise<Question> {
    const em = sourceQuestion.exactMatch

    if (!em) {
      throw new Error(
        'exactMatchReplicator called with question that has no exactMatch relation',
      )
    }

    return prisma.question.create({
      data: {
        ...commonFields,
        exactMatch: {
          create: {
            fields: em.fields
              ? {
                  create: em.fields.map((f) => ({
                    order: f.order,
                    statement: f.statement ?? null,
                    matchRegex: f.matchRegex ?? null,
                  })),
                }
              : undefined,
          },
        },
      },
    })
  },
}
