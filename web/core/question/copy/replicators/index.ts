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
import type { BaseQuestionCreateData } from '../base'

/**
 * Interface for question replicators that handle copying questions of specific types.
 *
 * Each replicator is responsible for:
 * - Taking the source question data (with type-specific relations)
 * - Combining it with common fields (title, content, tags, group, etc.)
 * - Creating a new question with all type-specific nested data
 *
 * @template TPayload - The typed payload containing the source question data with type-specific relations
 */
export interface QuestionReplicator<TPayload = any> {
  /**
   * Replicates a question by creating a copy with all its type-specific data.
   *
   * @param prisma - Prisma transaction client for database operations
   * @param sourceQuestion - The source question data loaded from database, including type-specific relations
   * @param commonFields - Common questionfields (title, content, tags, group, source tracking) for Prisma create
   * @returns The newly created question
   */
  replicate(
    prisma: Prisma.TransactionClient,
    sourceQuestion: TPayload,
    commonFields: BaseQuestionCreateData,
  ): Promise<Question>
}

export { multipleChoiceReplicator } from './multipleChoice'
export { trueFalseReplicator } from './trueFalse'
export { essayReplicator } from './essay'
export { webReplicator } from './web'
export { exactMatchReplicator } from './exactMatch'
export { codeReplicator } from './code'
export { databaseReplicator } from './database'
