import { Prisma } from '@prisma/client'

export const withLastUsed = Prisma.defineExtension((client) => {
  return client.$extends({
    result: {
      question: {
        lastUsed: {
          needs: { evaluation: true },
          compute(question) {
            const timestamps =
              question.evaluation?.map((e) =>
                new Date(
                  e.evaluation?.endAt ??
                  e.evaluation?.startAt ??
                  e.evaluation?.createdAt
                ).getTime()
              ) ?? []
            if (timestamps.length === 0) return null
            return new Date(Math.max(...timestamps))
          },
        },
      },
    },
  })
})
