import { Prisma } from '@prisma/client'

export const withLastUsed = Prisma.defineExtension((client) => {
  return client.$extends({
    result: {
      question: {
        lastUsed: {
          // We need copied children and, for EVAL children, their Evaluation.startAt
          // Also include one more hop for COPY children → their EVAL children.
          needs: {
            copiedQuestions: {
              select: {
                id: true,
                source: true, // 'EVAL' | 'COPY' | 'BANK'
                // For direct EVAL children, fetch their placements' startAt
                evaluation: {
                  select: {
                    evaluation: { select: { startAt: true } },
                  },
                },
                // One extra hop: COPY child → its EVAL children
                copiedQuestions: {
                  select: {
                    id: true,
                    source: true,
                    evaluation: {
                      select: {
                        evaluation: { select: { startAt: true } },
                      },
                    },
                  },
                },
              },
            },
          },
          compute(q) {
            // BANK/COPY derive from descendants; EVAL can return null
            // (safe for all cases though)
            const startsMs = []

            // Helper to push valid times
            const pushStarts = (nodes) => {
              for (const n of nodes ?? []) {
                // Direct EVAL children → take their evaluations' startAt
                if (n?.source === 'EVAL' || n?.source === 'COPY') {
                  for (const etq of n.evaluation ?? []) {
                    const d = etq?.evaluation?.startAt
                    if (d) {
                      const t = new Date(d).getTime()
                      if (Number.isFinite(t)) startsMs.push(t)
                    }
                  }
                }
                
              }
            }

            // === DEBUG LOGS ===
            // (comment out after verifying)
            console.log('\n--- Question ---')
            console.log('ID:', q.id)
            console.log('copiedQuestions count:', q.copiedQuestions?.length ?? 0)
            for (const child of q.copiedQuestions ?? []) {
              console.log('  child:', {
                id: child.id,
                source: child.source,
                evalCount: child.evaluation?.length ?? 0,
                copyChildren: child.copiedQuestions?.length ?? 0,
              })
            }

            pushStarts(q.copiedQuestions)

            console.log('  startsMs:', startsMs)
            if (startsMs.length === 0) return null
            return new Date(Math.max(...startsMs))
          },
        },
      },
    },
  })
})
