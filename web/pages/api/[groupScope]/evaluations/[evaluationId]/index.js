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
  EvaluationPhase,
  QuestionSource,
  QuestionUsageStatus,
  Role,
  UserOnEvaluationAccessMode,
} from '@prisma/client'
import { withPrisma } from '@/middleware/withPrisma'
import {
  withAuthorization,
  withGroupScope,
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { copyQuestion, questionSelectClause } from '@/code/questions'

const copyQuestionsForEvaluation = async (prisma, evaluationId) => {
  // get all the questions related to this evaluation
  const evaluationToQuestions = await prisma.evaluationToQuestion.findMany({
    where: {
      evaluationId: evaluationId,
    },
    include: {
      question: {
        select: {
          ...questionSelectClause({
            includeProfessorOnlyInfo: true,
            includeTypeSpecific: true,
            includeOfficialAnswers: true,
            includeTags: true,
          }),
          groupId: true, // Need this for copyQuestion function
        },
      },
    },
  })

  await prisma.$transaction(async (prisma) => {
    // unlink the questions from the evaluation
    await prisma.evaluationToQuestion.deleteMany({
      where: {
        evaluationId: evaluationId,
      },
    })

    for (const eToQ of evaluationToQuestions) {
      // copy the question
      const newQuestion = await copyQuestion(
        prisma,
        eToQ.question,
        QuestionSource.EVAL,
      )
      // create relation between evaluation and question
      await prisma.evaluationToQuestion.create({
        data: {
          points: eToQ.points,
          gradingPoints: eToQ.gradingPoints,
          order: eToQ.order,
          title: eToQ.title, // Copy the custom title
          evaluation: {
            connect: {
              id: evaluationId,
            },
          },
          question: {
            connect: {
              id: newQuestion.id,
            },
          },
        },
      })
    }
  })
}

const get = async (req, res, prisma) => {
  const { evaluationId } = req.query

  const evaluation = await prisma.evaluation.findUnique({
    where: {
      id: evaluationId,
    },
    include: {
      purgedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      archivedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  })

  res.status(200).json(evaluation)
}

const patch = async (req, res, prisma) => {
  const { evaluationId } = req.query

  const currentEvaluation = await prisma.evaluation.findUnique({
    where: {
      id: evaluationId,
    },
    select: {
      phase: true,
      startAt: true,
      durationHours: true,
      durationMins: true,
      accessMode: true,
    },
  })

  if (!currentEvaluation) {
    res.status(404).json({ message: 'evaluation not found' })
    return
  }

  const {
    phase: nextPhase,
    label,
    conditions,
    durationActive,
    durationHours,
    durationMins,
    endAt,
    status,
    consultationEnabled,
    showSolutionsWhenFinished,
    accessMode,
    accessList,
    ipRestrictions,
  } = req.body

  let data = {}

  if (nextPhase) {
    data.phase = nextPhase

    if (nextPhase === EvaluationPhase.REGISTRATION) {
      // Freeze the composition of the evaluation
      await copyQuestionsForEvaluation(prisma, evaluationId)
    }

    if (nextPhase === EvaluationPhase.IN_PROGRESS) {
      // Set start time when evaluation begins
      data.startAt = new Date()

      // Update usage status for source questions of EVAL questions in this evaluation
      await prisma.question.updateMany({
        where: {
          id: {
            in: await prisma.evaluationToQuestion
              .findMany({
                where: {
                  evaluationId: evaluationId,
                  question: {
                    source: QuestionSource.EVAL,
                    sourceQuestionId: { not: null },
                  },
                },
                select: {
                  question: {
                    select: {
                      sourceQuestionId: true,
                    },
                  },
                },
              })
              .then((results) =>
                results.map((r) => r.question.sourceQuestionId).filter(Boolean),
              ),
          },
        },
        data: {
          usageStatus: QuestionUsageStatus.USED,
          lastUsed: new Date(),
        },
      })

      // endAt is not set here - it will be set when moving to GRADING
    }

    if (
      currentEvaluation.phase === EvaluationPhase.IN_PROGRESS &&
      nextPhase === EvaluationPhase.GRADING
    ) {
      // Set end time when professor ends the evaluation
      data.endAt = new Date()
    }
  }

  if (label !== undefined) {
    data.label = label
  }

  if (conditions !== undefined) {
    data.conditions = conditions
  }

  if (status !== undefined) {
    data.status = status
  }

  if (durationActive !== undefined) {
    data.durationActive = durationActive
    data.durationHours = durationHours
    data.durationMins = durationMins
  }

  // endAt is automatically managed during phase transitions
  // Manual setting of endAt is not allowed

  // Handle consultation and solutions conflict resolution
  if (consultationEnabled !== undefined) {
    data.consultationEnabled = consultationEnabled

    // If consultation is disabled, also disable showing solutions
    if (!consultationEnabled) {
      data.showSolutionsWhenFinished = false
    } else if (showSolutionsWhenFinished !== undefined) {
      // If consultation is enabled, respect the showSolutionsWhenFinished value
      data.showSolutionsWhenFinished = showSolutionsWhenFinished
    }
  } else if (showSolutionsWhenFinished !== undefined) {
    // Only update showSolutionsWhenFinished if consultation is enabled
    if (currentEvaluation.consultationEnabled) {
      data.showSolutionsWhenFinished = showSolutionsWhenFinished
    }
  }

  if (ipRestrictions !== undefined) {
    data.ipRestrictions = ipRestrictions
  }

  if (accessMode !== undefined) {
    data.accessMode = accessMode
  }

  if (accessList !== undefined) {
    data.accessList = accessList
  }

  let evaluationAfterUpdate = undefined
  await prisma.$transaction(async (prisma) => {
    evaluationAfterUpdate = await prisma.evaluation.update({
      where: {
        id: evaluationId,
      },
      data: data,
    })

    if (
      currentEvaluation.accessMode ===
      UserOnEvaluationAccessMode.LINK_AND_ACCESS_LIST
    ) {
      // remove eventual denied students
      await prisma.userOnEvaluationDeniedAccessAttempt.deleteMany({
        where: {
          evaluationId: evaluationId,
          userEmail: {
            in: accessList || [],
          },
        },
      })
    }
  })

  res.status(200).json(evaluationAfterUpdate)
}

const del = async (req, res, prisma) => {
  const { groupScope, evaluationId } = req.query

  /*
        get all the questions related to this evaluation
        It is not possible to cascade delete the questions because we passed bv and an intermediate relation
     */
  const jstqs = await prisma.evaluationToQuestion.findMany({
    where: {
      evaluationId: evaluationId,
    },
  })

  const questionIds = jstqs.map((jstq) => jstq.questionId)

  await prisma.$transaction(async (prisma) => {
    // delete all the questions related to this evaluation
    await prisma.question.deleteMany({
      where: {
        id: {
          in: questionIds,
        },
        source: {
          not: QuestionSource.BANK,
        },
        group: {
          scope: groupScope,
        },
      },
    })
    await prisma.evaluation.delete({
      where: {
        id: evaluationId,
      },
    })
  })

  res.status(200).json({ message: 'evaluation deleted' })
}

export default withGroupScope(
  withMethodHandler({
    GET: withAuthorization(withPrisma(get), [Role.PROFESSOR]),
    PATCH: withAuthorization(withPrisma(patch), [Role.PROFESSOR]),
    DELETE: withAuthorization(withPrisma(del), [Role.PROFESSOR]),
  }),
)
