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

import { selectForProfessorEvaluationQuestionsWithGradings } from '.'

const selectClause = selectForProfessorEvaluationQuestionsWithGradings()

// Verify structure matches Prisma schema
console.log('=== VERIFICATION REPORT ===\n')

// Base fields
console.log(
  '✓ Base fields:',
  Object.keys(selectClause).filter((k) =>
    [
      'id',
      'type',
      'status',
      'content',
      'createdAt',
      'updatedAt',
      'title',
      'scratchpad',
    ].includes(k),
  ),
)

// Type-specific relations
const typeSpecificKeys = [
  'multipleChoice',
  'trueFalse',
  'essay',
  'web',
  'exactMatch',
  'code',
  'database',
]
const hasTypeSpecific = typeSpecificKeys.some((key) => key in selectClause)
console.log(
  '✓ Type-specific relations:',
  hasTypeSpecific ? 'Present' : 'MISSING',
)

// MultipleChoice structure
if ('multipleChoice' in selectClause) {
  const mc = selectClause.multipleChoice as any
  console.log('\n✓ MultipleChoice:')
  console.log('  - Fields:', mc?.select ? Object.keys(mc.select) : 'N/A')
  console.log('  - Has options:', !!mc?.select?.options)
  console.log(
    '  - Options fields:',
    mc?.select?.options?.select ? Object.keys(mc.select.options.select) : 'N/A',
  )
  console.log('  - Has gradingPolicy:', !!mc?.select?.gradingPolicy)
}

// StudentAnswer structure
if ('studentAnswer' in selectClause) {
  const sa = selectClause.studentAnswer as any
  console.log('\n✓ StudentAnswer:')
  console.log('  - Has where clause:', !!sa?.where)
  console.log('  - Select fields:', sa?.select ? Object.keys(sa.select) : 'N/A')
  console.log('  - Has studentGrading:', !!sa?.select?.studentGrading)
  console.log('  - Has code:', !!sa?.select?.code)
  console.log('  - Has database:', !!sa?.select?.database)
}

// Tags
console.log(
  '\n✓ Tags:',
  'questionToTag' in selectClause ? 'Present' : 'MISSING',
)
