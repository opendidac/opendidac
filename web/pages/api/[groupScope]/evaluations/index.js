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
import {
  Role,
  EvaluationPhase,
  UserOnEvaluationAccessMode,
  QuestionSource,
  QuestionStatus,
} from '@prisma/client'
import { withPrisma } from '@/middleware/withPrisma'
import {
  withAuthorization,
  withGroupScope,
  withMethodHandler,
} from '@/middleware/withAuthorization'

const get = async (req, res, prisma) => {
  // shallow session to question get -> we just need to count the number of questions
  const { groupScope } = req.query

  const evaluations = await prisma.evaluation.findMany({
    where: {
      group: {
        scope: groupScope,
      },
    },
    include: {
      _count: {
        select: {
          evaluationToQuestions: true,
        },
      },
      students: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  res.status(200).json(evaluations)
}

/*
 ** Creating a new evaluation
 * */
const post = async (req, res, prisma) => {
  const { groupScope } = req.query

  const {
    preset: { value: presetType, settings },
    templateEvaluation,
  } = req.body

  let data = {
    phase: EvaluationPhase.DRAFT,
    group: {
      connect: {
        scope: groupScope,
      },
    },
  }

  if (presetType === 'from_existing') {
    data = {
      ...data,
      label: `Copy of ${templateEvaluation.label}`,
      conditions: templateEvaluation.conditions,
      accessMode: templateEvaluation.accessMode,
      accessList: templateEvaluation.accessList,
      durationHours: templateEvaluation.durationHours,
      durationMins: templateEvaluation.durationMins,
      consultationEnabled: templateEvaluation.consultationEnabled,
      showSolutionsWhenFinished: templateEvaluation.showSolutionsWhenFinished,
    }
  } else {
    data = {
      ...data,
      label: '',
      consultationEnabled: settings.consultationEnabled,
      showSolutionsWhenFinished: settings.showSolutionsWhenFinished,
      accessMode: settings.restrictAccess
        ? UserOnEvaluationAccessMode.LINK_AND_ACCESS_LIST
        : UserOnEvaluationAccessMode.LINK_ONLY,
    }
  }

  try {
    let evaluation = undefined
    await prisma.$transaction(async (prisma) => {
      evaluation = await prisma.evaluation.create({ data })

      if (presetType === 'from_existing') {
        // Attach all of the SOURCE questions from the template evaluation to the new evaluation

        const originalEvaluation = await prisma.evaluation.findUnique({
          where: {
            id: templateEvaluation.id,
          },
          include: {
            evaluationToQuestions: {
              select: {
                question: {
                  select: {
                    id: true,
                    source: true,
                    status: true,
                    sourceQuestion: {
                      select: {
                        id: true,
                        status: true,
                      },
                    },
                  },
                },
                points: true,
                order: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        })

        const templateQuestions = originalEvaluation.evaluationToQuestions

        for (const templateToQuestion of templateQuestions) {
          const question =
            templateToQuestion.question.source === QuestionSource.BANK
              ? templateToQuestion.question
              : templateToQuestion.question.sourceQuestion

          if (
            question === null ||
            question.status === QuestionStatus.ARCHIVED
          ) {
            // skip questions that no longer exist or are archived
            continue
          }

          // create relation between evaluation and a source question
          await prisma.evaluationToQuestion.create({
            data: {
              points: templateToQuestion.points,
              order: templateToQuestion.order,
              evaluation: {
                connect: {
                  id: evaluation.id,
                },
              },
              question: {
                connect: {
                  id: question.id,
                },
              },
            },
          })
        }
      }
    })

    res.status(200).json(evaluation)
  } catch (e) {
    console.log(e)
    switch (e.code) {
      case 'P2002':
        res.status(409).json({ message: 'evaluation label already exists' })
        break
      default:
        res.status(500).json({ message: 'Error while creating a evaluation' })
        break
    }
  }
}

export default withGroupScope(
  withMethodHandler({
    GET: withAuthorization(withPrisma(get), [Role.PROFESSOR]),
    POST: withAuthorization(withPrisma(post), [Role.PROFESSOR]),
  }),
)
