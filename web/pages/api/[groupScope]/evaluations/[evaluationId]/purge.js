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

/**
 * Purge student data for an evaluation while preserving composition and roster.
 *
 * KEPT:
 *  - Evaluation, EvaluationToQuestion (points/order), UserOnEvaluation (participants).
 *
 * REMOVED (directly or by cascade):
 *  - StudentAnswer (and all StudentAnswer* trees)        [by cascade]
 *  - StudentQuestionGrading                               [by cascade]
 *  - TestCaseResult                                       [by cascade via StudentAnswerCodeWriting]
 *  - Annotation                                           [by cascade via StudentAnswer]
 *  - Student DatabaseQuery (student-owned)                [explicit delete]
 *  - File (student code files via StudentAnswerCodeToFile)[explicit delete]
 *  - StudentAnswerCodeHistory                             [explicit delete]
 */

import { withPrisma } from '@/middleware/withPrisma'
import {
  withAuthorization,
  withGroupScope,
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { EvaluationPhase, Role } from '@prisma/client'
import { getUser } from '@/code/auth/auth'

const post = async (req, res, prisma) => {
  const { evaluationId } = req.query

  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    select: { id: true, phase: true },
  })
  if (!evaluation) {
    res.status(404).json({ message: 'evaluation not found' })
    return
  }

  // Check if the evaluation has already been purged
  if (evaluation.purgedAt) {
    res.status(400).json({ message: 'evaluation already purged' })
    return
  }

  // Check if the evaluation is in a phase that allows purging
  if (
    evaluation.phase !== EvaluationPhase.FINISHED &&
    evaluation.phase !== EvaluationPhase.GRADING
  ) {
    res.status(400).json({ message: 'evaluation is not finished' })
    return
  }

  // Get the purger user
  const user = await getUser(req, res)

  if (!user) {
    res.status(401).json({ message: 'unauthorized' })
    return
  }

  // IDs we’ll target
  const [eToQs, participants] = await Promise.all([
    prisma.evaluationToQuestion.findMany({
      where: { evaluationId },
      select: { questionId: true },
    }),
    prisma.userOnEvaluation.findMany({
      where: { evaluationId },
      select: { userEmail: true },
    }),
  ])
  const questionIds = eToQs.map((x) => x.questionId)
  const emails = participants.map((x) => x.userEmail)

  if (questionIds.length === 0 || emails.length === 0) {
    res.status(200).json({
      message: 'nothing to purge',
      kept: {
        evaluation: evaluationId,
        composition: true,
        participants: emails.length,
      },
      stats: {
        studentDbQueries: 0,
        files: 0,
        codeHistory: 0,
        studentAnswers: 0,
      },
    })
    return
  }

  const stats = await prisma.$transaction(async (tx) => {
    // 1) Delete student-owned DatabaseQuery rows.
    //    Rationale: these do NOT cascade from StudentAnswer; if we don’t remove them, they remain.
    //    Filter: queries having the 1–1 studentAnswerDatabaseToQuery link for our user/question scope.
    const studentDbQueriesDeleted = await tx.databaseQuery.deleteMany({
      where: {
        studentAnswerDatabaseToQuery: {
          is: {
            userEmail: { in: emails },
            questionId: { in: questionIds },
          },
        },
      },
    })

    // 2) Delete student code files.
    //    Rationale: File belongs to the question’s CodeWriting; it won’t be deleted by StudentAnswer cascade.
    //    Filter via the join: files that have a StudentAnswerCodeToFile link for our user/question scope.
    //
    //    NOTE: We’re *not* deleting Annotations manually; they’ll be removed when the StudentAnswer is deleted.
    //    This assumes the Annotation.fileId FK allows deleting File (fileId is optional in your schema).
    const filesDeleted = await tx.file.deleteMany({
      where: {
        studentAnswerCode: {
          is: {
            userEmail: { in: emails },
            questionId: { in: questionIds },
          },
        },
      },
    })

    // 3) Delete code edit history (no FK to StudentAnswer → won’t cascade).
    const codeHistoryDeleted = await tx.studentAnswerCodeHistory.deleteMany({
      where: {
        userEmail: { in: emails },
        questionId: { in: questionIds },
      },
    })

    // 4) Finally, delete StudentAnswer (this cascades StudentAnswer* + gradings + test results + annotations).
    const studentAnswersDeleted = await tx.studentAnswer.deleteMany({
      where: {
        userEmail: { in: emails },
        questionId: { in: questionIds },
      },
    })

    // 5) Update the evaluation to set the purge date and user
    await tx.evaluation.update({
      where: { id: evaluationId },
      data: {
        purgedAt: new Date(),
        purgedByUserEmail: user.email,
      },
    })

    return {
      studentDbQueries: studentDbQueriesDeleted.count,
      files: filesDeleted.count,
      codeHistory: codeHistoryDeleted.count,
      studentAnswers: studentAnswersDeleted.count,
    }
  })

  res.status(200).json({
    message: 'evaluation data purged',
    stats,
  })
}

export default withGroupScope(
  withMethodHandler({
    POST: withAuthorization(withPrisma(post), [Role.PROFESSOR]),
  }),
)
