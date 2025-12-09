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
 * TrueFalse Replicator
 */

import type { Prisma, Question } from '@prisma/client'
import type { BaseQuestionCreateData, QuestionCopyPayload } from '../base'
import { SELECT_TRUE_FALSE_MERGED_QUESTION } from '@/code/question/select/modules/officialAnswers'

import type { QuestionReplicator } from '.'

/**
 * Extract the properly-typed trueFalse relation from the merged literal structure.
 * The select structure is composed in the select modules, keeping schema details
 * out of the replicator code.
 */
type TrueFalseRelationType = Prisma.QuestionGetPayload<{
  select: typeof SELECT_TRUE_FALSE_MERGED_QUESTION
}>['trueFalse']

/**
 * Payload type with properly-typed trueFalse relation.
 * Combines the base QuestionCopyPayload (which has all other fields correctly typed)
 * with our explicitly-typed trueFalse relation that preserves deep literal structure.
 */
export type TFCopyPayload = Omit<QuestionCopyPayload, 'trueFalse'> & {
  trueFalse: TrueFalseRelationType | null
}

export const trueFalseReplicator: QuestionReplicator<TFCopyPayload> = {
  async replicate(
    prisma: Prisma.TransactionClient,
    sourceQuestion: TFCopyPayload,
    commonFields: BaseQuestionCreateData,
  ): Promise<Question> {
    const tf = sourceQuestion.trueFalse

    if (!tf) {
      throw new Error(
        'trueFalseReplicator called with question that has no trueFalse relation',
      )
    }

    return prisma.question.create({
      data: {
        ...commonFields,
        trueFalse: {
          create: {
            isTrue: tf.isTrue ?? null,
          },
        },
      },
    })
  },
}
