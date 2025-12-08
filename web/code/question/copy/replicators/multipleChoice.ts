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

import type { Prisma, Question } from '@prisma/client'
import type { BaseQuestionCreateData, QuestionCopyPayload } from '../base'
import { SELECT_MULTIPLE_CHOICE_MERGED_QUESTION } from '@/code/question/select/modules/officialAnswers'

import type { QuestionReplicator } from '.'

type Tx = Prisma.TransactionClient

/**
 * Extract the properly-typed multipleChoice relation from the merged literal structure.
 * The select structure is composed in the select modules, keeping schema details
 * out of the replicator code.
 */
type MultipleChoiceRelationType = Prisma.QuestionGetPayload<{
  select: typeof SELECT_MULTIPLE_CHOICE_MERGED_QUESTION
}>['multipleChoice']

/**
 * Payload type with properly-typed multipleChoice relation.
 * Combines the base QuestionCopyPayload (which has all other fields correctly typed)
 * with our explicitly-typed multipleChoice relation that preserves deep literal structure.
 */
export type MCCopyPayload = Omit<QuestionCopyPayload, 'multipleChoice'> & {
  multipleChoice: MultipleChoiceRelationType | null
}

export const multipleChoiceReplicator: QuestionReplicator<MCCopyPayload> = {
  async replicate(
    tx: Tx,
    q: MCCopyPayload,
    baseData: BaseQuestionCreateData,
  ): Promise<Question> {
    const mc = q.multipleChoice

    if (!mc) {
      throw new Error(
        'multipleChoiceReplicator called with question that has no multipleChoice relation',
      )
    }

    return tx.question.create({
      data: {
        ...baseData,
        multipleChoice: {
          create: {
            gradingPolicy: mc.gradingPolicy,
            activateStudentComment: mc.activateStudentComment,
            studentCommentLabel: mc.studentCommentLabel,
            activateSelectionLimit: mc.activateSelectionLimit,
            selectionLimit: mc.selectionLimit,
            options: mc.options
              ? {
                  create: mc.options.map((opt) => ({
                    order: opt.order,
                    text: opt.text,
                    isCorrect: opt.isCorrect,
                  })),
                }
              : undefined,
          },
        },
      },
    })
  },
}
