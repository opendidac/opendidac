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
 * Essay Replicator
 */

import type { Prisma, Question } from '@prisma/client'
import type { BaseQuestionCreateData, QuestionCopyPayload } from '../base'
import { SELECT_ESSAY_MERGED_QUESTION } from '@/core/question/select/modules/officialAnswers'

import type { QuestionReplicator } from '.'

type Tx = Prisma.TransactionClient

/**
 * Extract the properly-typed essay relation from the merged literal structure.
 * The select structure is composed in the select modules, keeping schema details
 * out of the replicator code.
 */
type EssayRelationType = Prisma.QuestionGetPayload<{
  select: typeof SELECT_ESSAY_MERGED_QUESTION
}>['essay']

/**
 * Payload type with properly-typed essay relation.
 * Combines the base QuestionCopyPayload (which has all other fields correctly typed)
 * with our explicitly-typed essay relation that preserves deep literal structure.
 */
export type EssayCopyPayload = Omit<QuestionCopyPayload, 'essay'> & {
  essay: EssayRelationType | null
}

export const essayReplicator: QuestionReplicator<EssayCopyPayload> = {
  async replicate(
    tx: Tx,
    q: EssayCopyPayload,
    baseData: BaseQuestionCreateData,
  ): Promise<Question> {
    const es = q.essay

    if (!es) {
      throw new Error(
        'essayReplicator called with question that has no essay relation',
      )
    }

    return tx.question.create({
      data: {
        ...baseData,
        essay: {
          create: {
            solution: es.solution ?? null,
            template: es.template ?? null,
          },
        },
      },
    })
  },
}
