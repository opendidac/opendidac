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
import { cleanUpDockerStreamHeaders } from './utils'
import { runSandbox } from './runSandboxTC.js'

export const runSQLFluffSandbox = async ({ sql, rules = '' }) => {
  const response = await runSandbox({
    image: 'ghcr.io/opendidac/database-sandbox-image/sqlfluff-linter',
    files: [
      {
        path: '.sqlfluff',
        content: rules,
      },
    ],
    tests: [
      {
        exec: `sqlfluff lint - --dialect postgres --format json`,
        input: sql,
      },
    ],
  })

  const out = response.tests[0]?.output || ''
  return {
    console: response.beforeAll,
    violations: groupByViolations(
      JSON.parse(cleanUpDockerStreamHeaders(out) || '[]'),
    ),
  }
}

const groupByViolations = (lintResults) => {
  if (lintResults.length === 0) {
    return {
      violations: [],
    }
  }

  const lintResult = lintResults[0]

  const groupedViolations = {}

  lintResult.violations.forEach((violation) => {
    const { line_no, line_pos, code, description, name } = violation

    if (!groupedViolations[code]) {
      groupedViolations[code] = {
        description,
        name,
        code,
        lines: [],
      }
    }

    groupedViolations[code].lines.push({ line: line_no, pos: line_pos })
  })

  lintResult.violations = Object.values(groupedViolations)

  return lintResult
}
