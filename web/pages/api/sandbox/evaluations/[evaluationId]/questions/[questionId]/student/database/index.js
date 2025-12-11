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

import { DatabaseQueryOutputType, Prisma, Role } from '@prisma/client'
import { grading } from '@/core/grading/engine'
import { isInProgress } from '@/pages/api/users/evaluations/[evaluationId]/questions/[questionId]/answers/utils'
import { runSandboxDB } from '@/sandbox/runSandboxDB'
import { runTestsOnDatasets } from '@/core/database'
import { runSQLFluffSandbox } from '@/sandbox/runSQLFluffSandbox'
import { withAuthorization } from '@/middleware/withAuthorization'
import { withApiContext } from '@/middleware/withApiContext'
import { getUser } from '@/core/auth/auth'

/*
 endpoint to run the database sandbox for a users answers
 Only uses queries stored in the database
 */

const getStudentAnswer = async (prisma, studentEmail, questionId) => {
  return await prisma.studentAnswer.findUnique({
    where: {
      userEmail_questionId: {
        userEmail: studentEmail,
        questionId: questionId,
      },
    },
    include: {
      database: {
        include: {
          queries: {
            include: {
              query: {
                include: {
                  queryOutputTests: true,
                },
              },
              studentOutput: true,
            },
            orderBy: {
              query: { order: 'asc' },
            },
          },
        },
      },
      question: {
        include: {
          evaluation: true,
          database: {
            include: {
              solutionQueries: {
                include: {
                  query: {
                    select: {
                      order: true, // we use order to map users query to solution query output
                    },
                  },
                  output: true,
                },
              },
            },
          },
        },
      },
    },
  })
}

const post = async (req, res, ctx) => {
  const { prisma } = ctx
  const user = await getUser(req, res)

  const { evaluationId, questionId } = req.query
  const studentEmail = user.email

  if (!(await isInProgress(evaluationId, prisma))) {
    res.status(400).json({ message: 'evaluation is not in progress' })
    return
  }

  const studentAnswer = await getStudentAnswer(prisma, studentEmail, questionId)

  if (!studentAnswer) {
    res.status(404).json({ message: 'Student answer not found' })
    return
  }

  const image = studentAnswer.question.database.image
  const sqlQueries = studentAnswer.database.queries.map((q) => q.query.content)

  // run the database sandbox
  const result = await runSandboxDB({
    image: image,
    queries: sqlQueries,
  })

  // run the lint sandbox
  const lintResults = {}
  const studentAnswerQueries = studentAnswer.database.queries

  for (const answerToQuery of studentAnswerQueries) {
    const query = answerToQuery.query
    if (query.lintActive) {
      try {
        lintResults[query.id] = await runSQLFluffSandbox({
          sql: query.content,
          sqlFluffRules: query.lintRules,
        })
      } catch (e) {
        // Handle or log error
        lintResults[query.id] = null // or an appropriate error indicator
      }
    }
  }

  // update the users answwer with new query outputs
  await prisma.$transaction(async (prisma) => {
    const solutionQueryOutputs = studentAnswer.question.database.solutionQueries

    // for each users answer query, upsert the DatabaseQueryOutput in the database
    for (let i = 0; i < studentAnswerQueries.length; i++) {
      const query = studentAnswerQueries[i].query
      const currentOutput = result[i]

      if (query.lintActive) {
        // update the DatabaseQuery with the lint result
        const lintResult = lintResults[query.id]
        await prisma.databaseQuery.update({
          where: {
            id: query.id,
          },
          data: {
            lintResult: !lintResult ? Prisma.JsonNull : lintResult.violations,
          },
        })
      }

      const studentAnswerDatabaseToQuery =
        await prisma.studentAnswerDatabaseToQuery.findUnique({
          where: {
            userEmail_questionId_queryId: {
              userEmail: studentEmail,
              questionId: questionId,
              queryId: query.id,
            },
          },
          include: {
            studentOutput: true,
          },
        })

      const existingOutput = studentAnswerDatabaseToQuery.studentOutput

      if (currentOutput) {
        const outputData = {
          output: currentOutput,
          type: currentOutput.type,
          status: currentOutput.status,
        }

        // Eventually apply tests on test query outputs
        if (query.testQuery) {
          let testPassed = false
          const solutionOutput = solutionQueryOutputs.find(
            (solQ) => solQ.query.order === query.order,
          ).output.output
          if (currentOutput.type === solutionOutput.type) {
            switch (currentOutput.type) {
              case DatabaseQueryOutputType.TEXT:
                testPassed = currentOutput.result === solutionOutput.result
                break
              case DatabaseQueryOutputType.SCALAR:
              case DatabaseQueryOutputType.TABULAR:
                const tests = query.queryOutputTests.map((ot) => ot.test)
                testPassed = runTestsOnDatasets(
                  solutionOutput.result,
                  currentOutput.result,
                  tests,
                )
                break
            }
          }

          // include test results in the output
          outputData.output = {
            ...outputData.output,
            testPassed: testPassed,
          }
        }

        // we got output for the current query, update the users query output
        if (existingOutput) {
          await prisma.databaseQueryOutput.update({
            where: {
              id: existingOutput.id,
            },
            data: {
              ...outputData,
            },
          })
        } else {
          // create new output and connect it to the solution query
          await prisma.databaseQueryOutput.create({
            data: {
              ...outputData,
              studentAnswer: {
                connect: {
                  userEmail_questionId_queryId: {
                    userEmail: studentEmail,
                    questionId: questionId,
                    queryId: query.id,
                  },
                },
              },
              query: {
                // this relation is needed for the output to be deleted when the query is deleted
                connect: {
                  id: query.id,
                },
              },
            },
          })
        }
      } else {
        // some previous queries failed, lets delete the output of the next queries
        if (existingOutput) {
          await prisma.databaseQueryOutput.delete({
            where: {
              id: existingOutput.id,
            },
          })
        }
      }
    }

    // GRADING

    // get the users answers after the update
    const updatedStudentAnswer = await getStudentAnswer(
      prisma,
      studentEmail,
      questionId,
    )

    const totalPoints = studentAnswer.question.evaluation?.[0]?.points || 0

    // code questions grading
    await prisma.studentQuestionGrading.upsert({
      where: {
        userEmail_questionId: {
          userEmail: studentEmail,
          questionId: questionId,
        },
      },
      update: grading(
        studentAnswer.question,
        totalPoints,
        updatedStudentAnswer,
      ),
      create: {
        userEmail: studentEmail,
        questionId: questionId,
        ...grading(studentAnswer.question, totalPoints, updatedStudentAnswer),
      },
    })
  })

  const studentAnswerDatabaseToQuery =
    await prisma.studentAnswerDatabaseToQuery.findMany({
      where: {
        userEmail: studentEmail,
        questionId: questionId,
      },
      include: {
        studentOutput: true,
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

  if (!studentAnswerDatabaseToQuery)
    res.status(404).json({ message: 'Not found' })

  res.status(200).json(studentAnswerDatabaseToQuery)
}

export default withApiContext({
  POST: withAuthorization(post, {
    roles: [Role.PROFESSOR, Role.STUDENT],
  }),
})
