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

import { QuestionType } from '@prisma/client'
import {
  codeReplicator,
  databaseReplicator,
  essayReplicator,
  exactMatchReplicator,
  multipleChoiceReplicator,
  trueFalseReplicator,
  webReplicator,
  type QuestionReplicator,
} from '@/core/question/copy/replicators'

/**
 * Registry mapping each QuestionType → its corresponding replicator.
 *
 * We only care that each value implements QuestionReplicator.
 * The specific payload narrowing is handled inside each replicator.
 */
export const replicatorRegistry: Record<QuestionType, QuestionReplicator> = {
  multipleChoice: multipleChoiceReplicator,
  trueFalse: trueFalseReplicator,
  essay: essayReplicator,
  web: webReplicator,
  exactMatch: exactMatchReplicator,
  code: codeReplicator,
  database: databaseReplicator,
}
