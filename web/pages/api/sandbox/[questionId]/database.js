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

import { Role, Prisma } from '@prisma/client'
import { runSandboxDB } from '@/sandbox/runSandboxDB'
import { runSQLFluffSandbox } from '@/sandbox/runSQLFluffSandbox'
import { withAuthorization } from '@/middleware/withAuthorization'
import { withApiContext } from '@/middleware/withApiContext'
import { withQuestionUpdate } from '@/middleware/withUpdate'

/*
 endpoint to run the sandbox for a database question with queries recovered from the database
 */
const post = async (ctx) => {
  const { req, res, prisma } = ctx
  const { questionId } = req.query

  const database = await prisma.database.findUnique({
    where: {
      questionId: questionId,
    },
    include: {
      solutionQueries: {
        include: {
          query: true,
        },
        orderBy: {
          query: {
            order: 'asc',
          },
        },
      },
    },
  })

  const queries = database.solutionQueries.map(
    (dbToSolQuery) => dbToSolQuery.query.content,
  )

  // Run sandbox DB first
  const result = await runSandboxDB({
    image: database.image,
    queries: queries,
  })

  // Run SQLFluff for all queries that need linting before the transaction
  const lintResults = await Promise.all(
    database.solutionQueries.map(async ({ query }) => {
      if (!query.lintActive) return null

      try {
        const lintResult = await runSQLFluffSandbox({
          sql: query.content,
          rules: query.lintRules,
        })
        return {
          queryId: query.id,
          lintResult: lintResult.violations,
        }
      } catch (e) {
        console.log('Lint Sandbox Error', e)
        return {
          queryId: query.id,
          lintResult: Prisma.JsonNull,
        }
      }
    }),
  )

  // Now run the transaction with all results ready
  await prisma.$transaction(async (prisma) => {
    // Update lint results first
    for (const lintResult of lintResults) {
      if (!lintResult) continue

      await prisma.databaseQuery.update({
        where: {
          id: lintResult.queryId,
        },
        data: {
          lintResult: lintResult.lintResult,
        },
      })
    }

    // Then handle sandbox outputs
    for (let i = 0; i < database.solutionQueries.length; i++) {
      const query = database.solutionQueries[i].query
      const output = result[i]

      const databaseToSolutionQuery =
        await prisma.databaseToSolutionQuery.findUnique({
          where: {
            questionId_queryId: {
              questionId: questionId,
              queryId: query.id,
            },
          },
          include: {
            output: true,
          },
        })

      const existingOutput = databaseToSolutionQuery.output

      if (output) {
        const outputData = {
          output: output,
          type: output.type,
          status: output.status,
        }

        if (existingOutput) {
          await prisma.databaseQueryOutput.update({
            where: {
              id: existingOutput.id,
            },
            data: outputData,
          })
        } else {
          await prisma.databaseQueryOutput.create({
            data: {
              ...outputData,
              querySolution: {
                connect: {
                  questionId_queryId: {
                    questionId: questionId,
                    queryId: query.id,
                  },
                },
              },
              query: {
                connect: {
                  id: query.id,
                },
              },
            },
          })
        }
      } else if (existingOutput) {
        await prisma.databaseQueryOutput.delete({
          where: {
            id: existingOutput.id,
          },
        })
      }
    }
  })

  const solutionQueries = await prisma.databaseToSolutionQuery.findMany({
    where: {
      questionId: questionId,
    },
    include: {
      output: true,
      query: {
        select: {
          lintResult: true,
        },
      },
    },
    orderBy: {
      query: {
        order: 'asc',
      },
    },
  })

  if (!solutionQueries) res.status(404).json({ message: 'Not found' })

  res.status(200).json(solutionQueries)
}

export default withApiContext({
  POST: withAuthorization(withQuestionUpdate(post), {
    roles: [Role.PROFESSOR],
  }),
})
