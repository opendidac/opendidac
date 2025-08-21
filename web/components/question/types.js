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

const typesMap = {
  [QuestionType.multipleChoice]: 'Multiple Choice',
  [QuestionType.trueFalse]: 'True/False',
  [QuestionType.essay]: 'Essay',
  [QuestionType.code]: 'Code',
  [QuestionType.web]: 'Web',
  [QuestionType.database]: 'Database',
  [QuestionType.exactMatch]: 'Exact Match',
}

const toArray = () => {
  return Object.keys(typesMap).map((key) => ({
    value: key,
    label: typesMap[key],
  }))
}

const types = toArray()

const getTooltipByType = (type) => {
  const typeObject = types.find(({ value }) => value === type)
  return typeObject?.label
}

const getTextByType = (type) => typesMap[type] || 'Unknown Type'

export { typesMap, toArray, types, getTooltipByType, getTextByType }
