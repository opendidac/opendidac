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
import { EvaluationPhase, Role, ArchivalPhase } from '@prisma/client'
import { getUser } from '@/code/auth/auth'
import { purgeEvaluationData } from '@/code/evaluation/purge'

const post = async (req, res, prisma) => {
  const { evaluationId } = req.query

  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    select: { id: true, phase: true, archivalPhase: true },
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

  try {
    // Use the refactored purge function, but keep current archival phase (this is just data purging)
    const result = await purgeEvaluationData(
      prisma,
      evaluationId,
      user.email,
      ArchivalPhase.PURGED_WITHOUT_ARCHIVAL,
    )

    res.status(200).json({
      message: 'evaluation data purged',
      stats: result.stats,
    })
  } catch (error) {
    console.error('Error purging evaluation data:', error)
    res.status(500).json({ message: 'Failed to purge evaluation data' })
  }
}

export default withGroupScope(
  withMethodHandler({
    POST: withAuthorization(withPrisma(post), [Role.PROFESSOR]),
  }),
)
