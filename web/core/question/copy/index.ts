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
 * Main entrypoint: copies a question, including type-specific data,
 * tags, base fields, and any nested structures.
 */

import { Question, QuestionType, Prisma } from '@prisma/client'
import { SELECT_FOR_QUESTION_COPY } from '@/core/question/select'
import { buildBaseData, QuestionCopyPayload } from './base'
import { QuestionSource } from '@prisma/client'
import { type QuestionReplicator } from './replicators'
import { replicatorRegistry } from './registry'

/**
 * Copies a question, including type-specific data, tags, base fields, and nested structures.
 *
 * @param prisma - Prisma transaction client (transaction should be managed by caller)
 * @param questionId - ID of the question to copy
 * @param args - Optional arguments for source and title prefix
 * @returns The newly created question
 */
export async function copyQuestion(
  prisma: Prisma.TransactionClient,
  questionId: string,
  args?: {
    source?: QuestionSource
    prefix?: string
  },
): Promise<Question> {
  const source = args?.source ?? QuestionSource.COPY
  const prefix = args?.prefix ?? ''

  // 1. Load full question payload using your composed selects
  const payload = await prisma.question.findUniqueOrThrow({
    where: { id: questionId },
    select: SELECT_FOR_QUESTION_COPY,
  })

  // 2. Build base fields (title, tags, group, etc.)
  const baseData = buildBaseData(payload as QuestionCopyPayload, source, prefix)

  // 3. Pick replicator based on question.type
  const questionType = payload.type as QuestionType
  const replicator = replicatorRegistry[questionType] as QuestionReplicator

  if (!replicator) {
    throw new Error(`No replicator registered for type ${questionType}`)
  }

  // 4. Delegate deep copy to the appropriate replicator
  const newQuestion = await replicator.replicate(
    prisma,
    payload as any,
    baseData,
  )

  return newQuestion
}
