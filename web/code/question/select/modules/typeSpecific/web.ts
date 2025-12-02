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

import { Prisma } from '@prisma/client'

/**
 * Builds select clause for Web relation
 * Note: Official answers (solutionHtml, solutionCss, solutionJs) are handled by officialAnswers builder
 */
const buildWebSelect = (): Prisma.WebSelect => {
  return {
    questionId: true,
    templateHtml: true,
    templateCss: true,
    templateJs: true,
  }
}

/**
 * Builds web type-specific select clause for Question
 * Note: Official answers (solutionHtml, solutionCss, solutionJs) are handled by officialAnswers builder
 */
export const buildWeb = (): Prisma.QuestionSelect => {
  return {
    web: {
      select: buildWebSelect(),
    },
  }
}
