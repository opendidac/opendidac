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
 * Web Replicator
 */

import type { Prisma, Question } from '@prisma/client'
import type { BaseQuestionCreateData, QuestionCopyPayload } from '../base'
import { SELECT_WEB_MERGED_QUESTION } from '@/code/question/select/modules/officialAnswers'

import type { QuestionReplicator } from '.'

type Tx = Prisma.TransactionClient

/**
 * Extract the properly-typed web relation from the merged literal structure.
 * The select structure is composed in the select modules, keeping schema details
 * out of the replicator code.
 */
type WebRelationType = Prisma.QuestionGetPayload<{
  select: typeof SELECT_WEB_MERGED_QUESTION
}>['web']

/**
 * Payload type with properly-typed web relation.
 * Combines the base QuestionCopyPayload (which has all other fields correctly typed)
 * with our explicitly-typed web relation that preserves deep literal structure.
 */
export type WebCopyPayload = Omit<QuestionCopyPayload, 'web'> & {
  web: WebRelationType | null
}

export const webReplicator: QuestionReplicator<WebCopyPayload> = {
  async replicate(
    tx: Tx,
    q: WebCopyPayload,
    baseData: BaseQuestionCreateData,
  ): Promise<Question> {
    const w = q.web

    if (!w) {
      throw new Error(
        'webReplicator called with question that has no web relation',
      )
    }

    return tx.question.create({
      data: {
        ...baseData,
        web: {
          create: {
            templateHtml: w.templateHtml ?? null,
            templateCss: w.templateCss ?? null,
            templateJs: w.templateJs ?? null,

            solutionHtml: w.solutionHtml ?? null,
            solutionCss: w.solutionCss ?? null,
            solutionJs: w.solutionJs ?? null,
          },
        },
      },
    })
  },
}
