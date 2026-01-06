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

import type { NextApiRequest, NextApiResponse } from 'next'
import type { IApiContext } from '@/core/types/api'
import { getPrismaClient } from '@/core/hooks/usePrisma'
import { getUser } from '@/core/auth/auth'

/* --------------------------------------------------------------------------
 * API Context Middleware

/**
 * Unified entry point for all authenticated API routes.
 * Builds:
 *   - Next.js req / res objects (passed as first two arguments)
 *   - raw NextAuth session user
 *   - prisma client
 *
 * Usage: req.query, req.body, res.status(200).json(), etc.
 */

export function withApiContext(handlers: Record<string, Function>) {
  return async (nextReq: NextApiRequest, nextRes: NextApiResponse) => {
    const handler = handlers[nextReq.method || '']
    if (!handler) {
      return nextRes.status(405).json({ message: 'Method not allowed' })
    }

    const rawUser = await getUser(nextReq, nextRes)
    if (!rawUser) {
      return nextRes.status(401).json({ message: 'Unauthorized' })
    }

    const ctx: IApiContext = {
      user: rawUser,
      prisma: getPrismaClient(),
    }

    return handler(nextReq, nextRes, ctx)
  }
}
