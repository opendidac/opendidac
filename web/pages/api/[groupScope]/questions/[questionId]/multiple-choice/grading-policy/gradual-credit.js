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

import {
  withAuthorization,
  withGroupScope,
} from '@/middleware/withAuthorization'
import { withMethodHandler } from '@/middleware/withMethodHandler'
import { withPrisma } from '@/middleware/withPrisma'
import { withQuestionUpdate } from '@/middleware/withUpdate'

/**
 *
 * get: Get the gradual credit policy config
 */

// get the multichoice
const get = async (ctx) => {
  const { req, res, prisma } = ctx
  const { questionId } = req.query

  const gradualCredit =
    await prisma.multipleChoiceGradualCreditConfig.findUnique({
      where: {
        questionId: questionId,
      },
    })

  res.status(gradualCredit ? 200 : 404).json(gradualCredit)
}

// update the gradual credit policy
const put = async (ctx) => {
  const { req, res, prisma } = ctx
  const { questionId } = req.query
  const { negativeMarking, threshold } = req.body

  // update the multichoice gradual credit policy
  const updatedGradualCredit =
    await prisma.multipleChoiceGradualCreditConfig.update({
      where: { questionId: questionId },
      data: {
        negativeMarking,
        threshold,
      },
    })

  res.status(200).json(updatedGradualCredit)
}

// create the gradual credit policy
const post = async (ctx) => {
  const { req, res, prisma } = ctx
  const { questionId } = req.query
  const { negativeMarking, threshold } = req.body

  // create the multichoice gradual credit policy
  const createdGradualCredit =
    await prisma.multipleChoiceGradualCreditConfig.upsert({
      where: { questionId: questionId },
      create: {
        negativeMarking,
        threshold,
        questionId,
      },
      update: {
        negativeMarking,
        threshold,
      },
    })

  res.status(200).json(createdGradualCredit)
}

export default withMethodHandler({
  GET: withGroupScope(
    withAuthorization(withPrisma(get), { roles: [Role.PROFESSOR] }),
  ),
  PUT: withGroupScope(
    withAuthorization(withPrisma(withQuestionUpdate(put)), {
      roles: [Role.PROFESSOR],
    }),
  ),
  POST: withGroupScope(
    withAuthorization(withPrisma(withQuestionUpdate(post)), {
      roles: [Role.PROFESSOR],
    }),
  ),
})
