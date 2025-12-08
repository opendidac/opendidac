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
 * Load Handlebars templates and helpers.
 * @returns The Handlebars instance.
 */
import Handlebars from 'handlebars'
import * as templates from '@/code/evaluation/export/templates' // central export file
import * as helpers from '@/code/evaluation/export/helpers'

export function loadHandlebars() {
  Object.entries(templates.partials).forEach(([name, tpl]) =>
    Handlebars.registerPartial(name, tpl),
  )

  // Register aliases for partials (templates use different names than exports)
  if (templates.partials.studentAnswerExactMatchNeutral) {
    Handlebars.registerPartial(
      'studentAnswerExactMatch',
      templates.partials.studentAnswerExactMatchNeutral,
    )
  }

  Object.entries(helpers).forEach(([name, fn]) =>
    Handlebars.registerHelper(name, fn),
  )

  return Handlebars
}
