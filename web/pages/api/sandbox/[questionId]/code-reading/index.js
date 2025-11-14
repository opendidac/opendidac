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

import { Role } from '@prisma/client'
import { runSandbox } from '@/sandbox/runSandboxTC'
import {
  withAuthorization,
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { withPrisma } from '@/middleware/withPrisma'
import languages from '@/code/languages.json'

const environments = languages.environments

/*
 endpoint to run the sandbox for a code question of type reading to fill the expected output
 used to run the sandbox for admin, students cant run sandox for code reading
 */
const post = async (ctx, args) => {
  const { req, res, prisma } = ctx
  const { questionId } = req.query

  const code = await prisma.code.findUnique({
    where: {
      questionId: questionId,
    },
    include: {
      sandbox: true,
      codeReading: {
        select: {
          contextExec: true,
          contextPath: true,
          context: true,
          snippets: {
            orderBy: {
              order: 'asc', // Ensure snippets are ordered by the `order` field in ascending order
            },
          },
        },
      },
    },
  })

  if (!code || !code.codeReading) {
    res.status(404).json({ message: 'Code not found' })
    return
  }

  // Assuming `environments` is accessible and contains the configs
  const codeReadingConfig = environments.find(
    (env) => env.language === code.language,
  )?.codeReading

  if (!codeReadingConfig) {
    res.status(500).json({ message: 'Language not supported' })
    return
  }

  // --- minimal helpers for uniform body indentation (language-agnostic) ---
  const dedent = (s) => {
    const lines = String(s ?? '')
      .replace(/\r\n/g, '\n')
      .split('\n')
    const nonEmpty = lines.filter((l) => l.trim().length > 0)
    const indents = nonEmpty.map((l) => l.match(/^(\s*)/)?.[1].length ?? 0)
    const min = indents.length ? Math.min(...indents) : 0
    return lines.map((l) => l.slice(Math.min(min, l.length))).join('\n')
  }
  const indent = (s, n = 2) => {
    const pad = ' '.repeat(n)
    return String(s)
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((l) => (l.length ? pad + l : l)) // keep truly blank lines blank
      .join('\n')
  }
  const stripSpacesOnBlankLines = (s) => String(s).replace(/^[ \t]+$/gm, '')

  // Generate function declarations and calls
  let functionDeclarations = ''
  let functionCalls = ''
  const tests = []

  code.codeReading.snippets.forEach((snippet, index) => {
    const functionName = `snippetFunc${index}`
    if (!snippet.snippet) return

    // Uniformly indent every body line by 2 spaces (no language assumptions)
    const preparedBody = stripSpacesOnBlankLines(
      indent(dedent(snippet.snippet), 2),
    )

    const functionDeclaration =
      codeReadingConfig.snippetWrapperFunctionSignature
        .replace('{{SNIPPET_FUNCTION_NAME}}', functionName)
        .replace('{{SNIPPET_FUNCTION_BODY}}', preparedBody)

    functionDeclarations += functionDeclaration + '\n'
    functionCalls += `${codeReadingConfig.snippetFunctionCallTemplate.replace(
      new RegExp('{{SNIPPET_FUNCTION_NAME}}', 'g'),
      functionName,
    )}\n`

    tests.push({ exec: code.codeReading.contextExec, input: functionName })
  })

  // Do NOT re-indent the call block; trust the template spacing
  let correctlyIndentedFunctionCalls = functionCalls.trimEnd()

  // Insert generated function declarations and function calls into the context
  let context = code.codeReading.context
    .replace('{{SNIPPET_FUNCTION_DECLARATIONS}}', functionDeclarations)
    .replace('{{SNIPPET_FUNCTION_CALLS}}', correctlyIndentedFunctionCalls)

  const contextFile = {
    path: code.codeReading.contextPath,
    content: context,
  }

  // Execute in the sandbox
  const results = await runSandbox({
    image: code.sandbox.image,
    files: [contextFile],
    beforeAll: code.sandbox.beforeAll,
    tests: tests,
  })

  // Update output of snippets
  for (const snippet of code.codeReading.snippets) {
    const result = results.tests[snippet.order]
    await prisma.codeReadingSnippet.update({
      where: {
        id: snippet.id,
      },
      data: {
        output: result?.output || '',
      },
    })
  }

  res.status(200).send(results)
}

export default withMethodHandler({
  POST: withAuthorization(withPrisma(post), { roles: [Role.PROFESSOR] }),
})
