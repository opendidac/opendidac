/**
 * Copyright 2022-2024 HEIG-VD
 * Licensed under the Apache License, Version 2.0
 */

import { getPrisma } from './withPrisma'

export const withPurgeGuard = (handler) => {
  return async (req, res) => {
    const prisma = getPrisma()
    const { evaluationId } = req.query || {}

    if (!evaluationId) {
      return handler(req, res)
    }

    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      select: { id: true, purgedAt: true },
    })

    if (evaluation?.purgedAt) {
      return res.status(410).json({
        type: 'info',
        id: 'evaluation-purged',
        message: 'Evaluation data has been purged.',
      })
    }

    return handler(req, res)
  }
}
