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
import { Role, QuestionStatus } from '@prisma/client'
import { questionSelectClause, questionTypeSpecific } from '@/code/questions'
import {
  withAuthorization,
  withGroupScope,
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { withPrisma } from '@/middleware/withPrisma'

/**
 * Managing a question
 *
 * get: get a question by id
 * put: update a question
 *  only handles true/false, multiple choice, essay, and web questions, see questionTypeSpecific for more info
 *  database and code question have separate endpoints
 */

const get = async (req, res, prisma) => {
  // get a question by id
  const { groupScope, questionId } = req.query

  const question = await prisma.question.findFirst({
    where: {
      id: questionId,
      group: {
        scope: groupScope,
      },
    },
    select: questionSelectClause({
      includeTypeSpecific: true,
      includeOfficialAnswers: true,
      includeProfessorOnlyInfo: true,
    }),
  })
  res.status(200).json(question)
}

const put = async (req, res, prisma) => {
  const { groupScope } = req.query
  const { question } = req.body

  // Step 1: Retrieve the question
  const questionToBeUpdated = await prisma.question.findUnique({
    where: { id: question.id },
    include: { group: true },
  })

  // Step 2: Check if the user is authorized to update the question
  if (questionToBeUpdated.group.scope !== groupScope) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  // Step 3: Update the question
  const updatedQuestion = await prisma.question.update({
    where: {
      id: question.id,
    },
    data: {
      title: question.title,
      content: question.content,
      status: question.status,
      [question.type]: {
        update: questionTypeSpecific(question.type, question),
      },
    },
    include: {
      code: { select: { language: true } },
      multipleChoice: {
        select: { options: { select: { text: true, isCorrect: true } } },
      },
      trueFalse: { select: { isTrue: true } },
      essay: true,
      web: true,
      exactMatch: {
        select: {
          fields: {
            select: {
              id: true,
              statement: true,
              matchRegex: true,
              order: true,
            },
          },
        },
      },
    },
  })

  res.status(200).json(updatedQuestion)
}

const del = async (req, res, prisma) => {
  const { questionId } = req.query
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      questionToTag: {
        include: {
          tag: true,
        },
      },
    },
  })

  if (!question) {
    res.status(404).json({ message: 'Question not found' })
    return
  }

  if (question.status === QuestionStatus.ACTIVE) {
    res
      .status(400)
      .json({ message: 'Cannot delete active question. Archive it first.' })
    return
  }

  // Start a transaction to handle both question deletion and tag cleanup
  const deletedQuestion = await prisma.$transaction(async (tx) => {
    // Get the tags used by this question
    const tagsToCheck = question.questionToTag.map((qt) => ({
      groupId: qt.tag.groupId,
      label: qt.tag.label,
    }))

    // Delete the question (this will cascade delete QuestionToTag entries)
    const deleted = await tx.question.delete({
      where: {
        id: questionId,
      },
    })

    // For each tag, check if it's still used by other questions
    for (const tag of tagsToCheck) {
      const usageCount = await tx.questionToTag.count({
        where: {
          groupId: tag.groupId,
          label: tag.label,
        },
      })

      // If tag is no longer used, delete it
      if (usageCount === 0) {
        await tx.tag.delete({
          where: {
            groupId_label: {
              groupId: tag.groupId,
              label: tag.label,
            },
          },
        })
      }
    }

    return deleted
  })

  res.status(200).json(deletedQuestion)
}

export default withGroupScope(
  withMethodHandler({
    GET: withAuthorization(withPrisma(get), [Role.PROFESSOR]),
    PUT: withAuthorization(withPrisma(put), [Role.PROFESSOR]),
    DELETE: withAuthorization(withPrisma(del), [Role.PROFESSOR]),
  }),
)
