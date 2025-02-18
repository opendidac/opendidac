import { Role, QuestionSource } from '@prisma/client'
import { 
  withAuthorization, 
  withGroupScope, 
  withMethodHandler 
} from '@/middleware/withAuthorization'
import { withPrisma } from '@/middleware/withPrisma'

const put = async (req, res, prisma) => {
  const { groupScope, evaluationId, questionId } = req.query
  const { addendum } = req.body

  try {
    // First verify the evaluation to question exists and belongs to the correct group
    const evaluationToQuestion = await prisma.evaluationToQuestion.findFirst({
      where: {
        evaluationId: evaluationId,
        questionId: questionId,
        question: {
          source: QuestionSource.EVAL,
          group: {
            scope: groupScope,
          }
        }
      },
    })

    if (!evaluationToQuestion) {
      return res.status(404).json({ 
        message: 'Question not found or not part of this evaluation' 
      })
    }

    // Then update the addendum in EvaluationToQuestion
    await prisma.evaluationToQuestion.update({
      where: {
        evaluationId_questionId: {
          evaluationId: evaluationId,
          questionId: questionId,
        }
      },
      data: {
        addendum,
      },
    })

    res.status(200).json({ message: 'Addendum updated successfully' })
  } catch (error) {
    console.error('Error updating addendum:', error)
    res.status(500).json({ message: 'Failed to update addendum' })
  }
}

export default withGroupScope(
  withMethodHandler({
    PUT: withAuthorization(withPrisma(put), [Role.PROFESSOR]),
  })
) 