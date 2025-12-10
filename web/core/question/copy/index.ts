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

import { Question } from '@prisma/client'
import { selectForQuestionCopy } from '@/core/question/select'
import { buildBaseData } from './base'
import { replicatorRegistry } from './registry'
import { QuestionSource } from '@prisma/client'
import { getPrismaClient } from '@/core/hooks/usePrisma'

export async function copyQuestion(
  questionId: string,
  args?: {
    source?: QuestionSource
    prefix?: string
  },
): Promise<Question> {
  const source = args?.source ?? QuestionSource.COPY
  const prefix = args?.prefix ?? ''

  const prisma = getPrismaClient()

  return prisma.$transaction(async (tx) => {
    // 1. Load full question payload using your composed selects
    const payload = await tx.question.findUniqueOrThrow({
      where: { id: questionId },
      select: selectForQuestionCopy(),
    })

    // 2. Build base fields (title, tags, group, etc.)
    const baseData = buildBaseData(payload, source, prefix)

    // 3. Pick replicator based on question.type
    const replicator = replicatorRegistry[payload.type]

    if (!replicator) {
      throw new Error(`No replicator registered for type ${payload.type}`)
    }

    // 4. Delegate deep copy to the appropriate replicator
    const newQuestion = await replicator.replicate(tx, payload as any, baseData)

    return newQuestion
  })
}
