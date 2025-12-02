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

import { DatabaseQueryOutputStatus } from '@prisma/client'
import Handlebars from 'handlebars'
import { Remarkable } from 'remarkable'
import htmlspecialchars from 'htmlspecialchars'
import { regexpFromPattern } from '@/code/utils'

const md = new Remarkable({
  html: true,
})

export const formatCode = (code) => {
  // wrap it in markdown code block
  code = code || ''
  // escape special characters
  code = htmlspecialchars(code)
  // replace \n with <br> - this is important because otherwise the browsed adds whitespaces after each line
  code = code.replace(/\n/g, '<br>')

  // Join the trimmed lines back into a single string with proper newlines
  return new Handlebars.SafeString(`<pre>${code}</pre>`)
}

export const formatMarkdown = (markdown) => {
  return new Handlebars.SafeString(md.render(markdown))
}

export const equals = (a, b) => {
  return a === b
}

export const formatQuestionType = (question) => {
  let type = question.type

  if (question.code) {
    type = question.code.codeType
  }
  // Split camelCase into words, then capitalize the first letter of each word
  const formattedType = type
    // Insert a space before each uppercase letter and split into an array
    .replace(/([A-Z])/g, ' $1')
    // Split the string into words
    .trim()
    .toLowerCase()
    .split(' ')
    // Capitalize the first letter of each word
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    // Join the words back into a string
    .join(' ')

  return formattedType
}

export const countDatabasePassedTests = (queries) => {
  let passedCount = 0
  let totalTestQueries = 0
  queries.forEach((query) => {
    if (query.query.testQuery) {
      totalTestQueries++
      if (
        query.studentOutput &&
        query.studentOutput.status === DatabaseQueryOutputStatus.SUCCESS
      ) {
        passedCount++
      }
    }
  })
  return passedCount + '/' + totalTestQueries
}

export const chunkQuestions = (array, chunkSize, options) => {
  let result = ''
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize)
    result += options.fn(chunk) // Execute the block for each chunk
  }
  return result
}

export const calculateTotalPoints = (questions) => {
  return questions.reduce((acc, q) => acc + q.points, 0)
}

export const calculateObtainedPoints = (questions) => {
  return questions.reduce(
    (acc, q) => acc + (q.studentAnswer?.studentGrading?.pointsObtained || 0),
    0,
  )
}

export const exactMatchFieldAnswer = (fieldId, answers) => {
  if (!answers || !Array.isArray(answers)) return ''
  const fieldAnswer = answers.find((ans) => ans.fieldId === fieldId)
  return fieldAnswer ? fieldAnswer.value : ''
}

export const isExactMatchFieldCorrect = (fieldId, question, answers) => {
  if (!answers || !Array.isArray(answers)) return false
  const fieldAnswer = answers.find((ans) => ans.fieldId === fieldId)
  if (!fieldAnswer) return false
  const expectedField = question.exactMatch.fields.find((f) => f.id === fieldId)
  if (!expectedField) return false
  const fieldRegex = regexpFromPattern(expectedField.matchRegex)
  return fieldRegex.test(fieldAnswer.value)
}

export const isOptionSelected = (optionId, selectedOptions) => {
  if (!selectedOptions || !Array.isArray(selectedOptions)) return false
  return selectedOptions.some((opt) => opt.id === optionId)
}
