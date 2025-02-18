import { Role } from '@prisma/client'
import { 
  withAuthorization, 
  withGroupScope, 
  withMethodHandler 
} from '@/middleware/withAuthorization'
import { withPrisma } from '@/middleware/withPrisma'

const put = async (req, res, prisma) => {
  const { groupScope, questionId } = req.query
  const { addendum } = req.body

  try {
    await prisma.question.update({
      where: {
        id: questionId,
        group: {
          scope: groupScope,
        },
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