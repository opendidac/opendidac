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
import { DatabaseQueryOutputTest, Role, JsonNull } from '@prisma/client'
import {
  withAuthorization,
  withGroupScope,
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { withPrisma } from '@/middleware/withPrisma'
import { withQuestionUpdate } from '@/middleware/withUpdate'

/**
 * Managing the queries of a database question
 * put: update a query for a database question
 * del: delete a query for a database question
 */

const put = async (req, res, prisma) => {
  // update a query for a database question

  const { questionId, queryId } = req.query
  const {
    title,
    description,
    content,
    template,
    lintActive,
    lintRules,
    studentPermission,
    queryOutputTests,
    testQuery,
  } = req.body

  // check if the query belongs to the question
  const checkQuery = await prisma.databaseQuery.findUnique({
    where: {
      id: queryId,
    },
  })

  if (!checkQuery) {
    res.status(404).json({ message: 'Not found' })
    return
  }

  if (checkQuery.questionId !== questionId) {
    res.status(404).json({ message: 'Not found' })
    return
  }

  const data = {
    title: title,
    description: description,
    content: content,
    template: template,
    lintActive: lintActive,
    lintRules: lintRules,
    studentPermission: studentPermission,
    testQuery: testQuery,
    queryOutputTests: {
      deleteMany: {},
      create: queryOutputTests.map((queryOutputTest) => ({
        test: DatabaseQueryOutputTest[queryOutputTest.test],
      })),
    },
  }

  if (!lintActive) {
    data.lintResult = JsonNull
  }

  const query = await prisma.databaseQuery.update({
    where: {
      id: queryId,
    },
    data: data,
  })

  res.status(200).json(query)
}

const del = async (req, res, prisma) => {
  // DELETE a query for a database question

  const { questionId, queryId } = req.query

  // check if the query belongs to the question
  const checkQuery = await prisma.databaseQuery.findUnique({
    where: {
      id: queryId,
    },
  })

  if (!checkQuery) {
    res.status(404).json({ message: 'Not found' })
    return
  }

  if (checkQuery.questionId !== questionId) {
    res.status(404).json({ message: 'Not found' })
    return
  }

  let query

  await prisma.$transaction(async (prisma) => {
    query = await prisma.databaseQuery.delete({
      where: {
        id: queryId,
      },
    })

    // decrease the order of the queries that have a greater order than the deleted query
    const solQueries = await prisma.databaseToSolutionQuery.findMany({
      where: {
        questionId: questionId,
      },
      include: {
        query: true,
      },
      orderBy: {
        query: {
          order: 'asc',
        },
      },
    })
    for (let i = 0; i < solQueries.length; i++) {
      const solQuery = solQueries[i]

      await prisma.databaseQuery.update({
        where: {
          id: solQuery.query.id,
        },
        data: {
          order: i + 1, // Set order to index + 1 to make it 1-indexed
        },
      })
    }
  })

  res.status(200).json(query)
}

export default withGroupScope(
  withMethodHandler({
    PUT: withAuthorization(withQuestionUpdate(withPrisma(put)), [
      Role.PROFESSOR,
    ]),
    DELETE: withAuthorization(withQuestionUpdate(withPrisma(del)), [
      Role.PROFESSOR,
    ]),
  }),
)
