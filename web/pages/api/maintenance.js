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
import fs from 'fs/promises'
import path from 'path'
import {
  withAuthorization,
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { withPrisma } from '@/middleware/withPrisma'
import { runSandbox } from '@/sandbox/runSandboxTC'
import { CodeQuestionType, Role } from '@prisma/client'

const migrateCodeQuestionsExpectedOutput = async (prisma) => {
  // Select all Code questions of type codeWriting
  const codeQuestions = await prisma.code.findMany({
    where: {
      codeType: CodeQuestionType.codeWriting,
    },
    include: {
      codeWriting: {
        include: {
          testCases: true,
          solutionFiles: {
            include: {
              file: true,
            },
          },
        },
      },
      sandbox: true,
    },
  })

  for (const codeQuestion of codeQuestions) {
    if (!codeQuestion.codeWriting) continue // Skip if no codeWriting associated

    const { sandbox, codeWriting } = codeQuestion
    const { testCases } = codeWriting

    // Prepare sandbox execution parameters
    const sandboxParams = {
      image: sandbox.image,
      files: codeWriting.solutionFiles.map((sf) => sf.file), // Assuming solutionFiles is correctly related to files
      beforeAll: sandbox.beforeAll,
      tests: testCases,
    }

    // Execute the sandbox for the current question
    const result = await runSandbox(sandboxParams)

    // Update each test case with the new expected output from the sandbox result
    for (const testResult of result.tests) {
      // Find the corresponding test case by input
      const testCase = testCases.find((tc) => tc.input === testResult.input)
      if (!testCase) {
        console.warn(
          `No test case found with input '${testResult.input}' for questionId ${codeWriting.questionId}.`,
        )
        continue
      }

      try {
        await prisma.testCase.update({
          where: {
            index_questionId: {
              index: testCase.index,
              questionId: codeWriting.questionId,
            },
          },
          data: {
            expectedOutput: testResult.output, // Update the expected output with the sandbox output
          },
        })
      } catch (error) {
        console.error(
          `Error updating test case with input '${testResult.input}' for questionId ${codeWriting.questionId}:`,
          error,
        )
      }
    }
  }

  return true
}

const uploadsBasePath = path.join(process.cwd(), 'assets')

const extractUrlsFromMarkdown = (markdown) => {
  const regexp =
    /!\[.*?\]\((?:https?:\/\/[^\/]+)?\/api\/assets\/[^\)]+\)|\[.*?\]\((?:https?:\/\/[^\/]+)?\/api\/assets\/[^\)]+\)/g

  const urls = []
  let match
  while ((match = regexp.exec(markdown)) !== null) {
    const url = match[0].match(
      /\((http:\/\/localhost:3000\/api\/assets\/[^\)]+)\)/,
    )[1]
    urls.push(url)
  }
  return urls
}

const cleanupUnusedUploads = async (prisma, domainName) => {
  /* IMPORTANT
  
    Get all markdown fields from the database
    It is very important to keep this list up-to-date with all markdown fields that contain URLs
    that may reference uploaded files.

    This list should be updated whenever a new markdown field is added to the database.

    Missing fields may result in files being deleted even if they are still referenced in the database.

  */

  const markdownFields = [
    ...(await prisma.evaluation.findMany({ select: { conditions: true } })).map(
      (e) => e.conditions,
    ),
    ...(await prisma.question.findMany({ select: { content: true } })).map(
      (q) => q.content,
    ),
    ...(await prisma.essay.findMany({ select: { solution: true } })).map(
      (e) => e.solution,
    ),
    ...(
      await prisma.studentAnswerEssay.findMany({ select: { content: true } })
    ).map((sa) => sa.content),
  ]

  const referencedCUIDs = new Set()
  markdownFields.forEach((field) => {
    extractUrlsFromMarkdown(field).forEach((url) => {
      const urlPath = new URL(url).pathname
      const relativePath = urlPath.replace(/^\/+/, '').trim()
      const cuid = relativePath.split('/')[2] // Extract the CUID
      referencedCUIDs.add(cuid)
    })
  })

  const allDirectories = await fs.readdir(uploadsBasePath, {
    withFileTypes: true,
  })
  const allCUIDs = allDirectories
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)

  const cuidToDelete = allCUIDs.filter((cuid) => !referencedCUIDs.has(cuid))

  // Delete directories with non-referenced CUIDs
  for (let cuid of cuidToDelete) {
    await fs.rm(path.join(uploadsBasePath, cuid), {
      recursive: true,
      force: true,
    })
  }

  return {
    all: allCUIDs.length,
    deleted: cuidToDelete.length,
    referenced: referencedCUIDs.size,
  }
}

const post = async (req, res, prisma) => {
  const { action, options } = req.body

  try {
    switch (action) {
      case 'run_all_sandboxes_and_update_expected_output':
        const done = await migrateCodeQuestionsExpectedOutput(prisma)
        res.status(200).json({ done })
        break
      case 'cleanup_unused_uploads':
        const { all, deleted, referenced } = await cleanupUnusedUploads(
          prisma,
          options.domaine,
        )
        res.status(200).json({
          message: 'Cleanup successful',
          all,
          deleted,
          referenced,
        })
        break
      default:
        res.status(400).json({ error: 'Invalid action specified' })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export default withMethodHandler({
  POST: withAuthorization(withPrisma(post), [Role.SUPER_ADMIN]),
})
