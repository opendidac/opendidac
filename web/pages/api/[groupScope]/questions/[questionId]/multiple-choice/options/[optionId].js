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
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { withPrisma } from '@/middleware/withPrisma'
import { withQuestionUpdate } from '@/middleware/withUpdate'

// Update a single option of a multiple choice question
const put = async (req, res, prisma) => {
  const { questionId, optionId } = req.query
  const { text, isCorrect } = req.body || {}

  // Ensure the option exists and belongs to the question
  const existingOption = await prisma.option.findFirst({
    where: { id: optionId, questionId: questionId },
  })

  if (!existingOption) {
    res.status(404).json({ message: 'Option not found' })
    return
  }

  let updatedOption = null
  await prisma.$transaction(async (tx) => {
    updatedOption = await tx.option.update({
      where: { id: optionId },
      data: {
        text: text,
        isCorrect: isCorrect,
      },
    })

    // If selection limit sync is enabled, recompute the number of correct options
    const mc = await tx.multipleChoice.findUnique({
      where: { questionId: questionId },
      select: { activateSelectionLimit: true },
    })

    if (mc?.activateSelectionLimit) {
      const countCorrectOptions = await tx.option.count({
        where: { questionId: questionId, isCorrect: true },
      })

      await tx.multipleChoice.update({
        where: { questionId: questionId },
        data: { selectionLimit: countCorrectOptions },
      })
    }
  })

  res.status(200).json(updatedOption)
}

// Delete a single option of a multiple choice question
const del = async (req, res, prisma) => {
  const { questionId, optionId } = req.query

  // Ensure the option exists and belongs to the question
  const existingOption = await prisma.option.findFirst({
    where: { id: optionId, questionId: questionId },
  })

  if (!existingOption) {
    res.status(404).json({ message: 'Option not found' })
    return
  }

  await prisma.$transaction(async (tx) => {
    // Delete the option
    await tx.option.delete({ where: { id: optionId } })

    // Reorder remaining options by compacting their order starting at 0
    const remainingOptions = await tx.option.findMany({
      where: { questionId: questionId },
      orderBy: { order: 'asc' },
    })

    await Promise.all(
      remainingOptions.map((o, index) =>
        tx.option.update({ where: { id: o.id }, data: { order: index } }),
      ),
    )

    // If selection limit sync is enabled and the deleted option was correct, recompute
    const mc = await tx.multipleChoice.findUnique({
      where: { questionId: questionId },
      select: { activateSelectionLimit: true },
    })

    if (mc?.activateSelectionLimit && existingOption.isCorrect) {
      const countCorrectOptions = await tx.option.count({
        where: { questionId: questionId, isCorrect: true },
      })

      await tx.multipleChoice.update({
        where: { questionId: questionId },
        data: { selectionLimit: countCorrectOptions },
      })
    }
  })

  res.status(200).json({ message: 'Option deleted and reordered' })
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
