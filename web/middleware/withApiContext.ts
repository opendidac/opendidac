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
import type { Session } from 'next-auth'
import type {
  IApiContext,
  IApiRequest,
  IApiResponse,
  ISessionUser,
} from '@/types/api'
import { SessionUser } from '@/types/api/context'
import { getPrismaClient } from '@/code/hooks/usePrisma'
import { getUser } from '@/code/auth/auth'

/* --------------------------------------------------------------------------
 * API Context Middleware
 * --------------------------------------------------------------------------
 * Creates framework-agnostic request/response adapters and normalized user.
 * All endpoints use the portable req/res API.
 * -------------------------------------------------------------------------- */

/**
 * Convert Next.js response → framework-agnostic IApiResponse.
 * Uses single-method approach (no chaining) for framework compatibility.
 */
function nextResponseAdapter(res: NextApiResponse): IApiResponse {
  return {
    response(status: number, body: unknown) {
      res.status(status).json(body)
    },

    ok(body: unknown) {
      res.status(200).json(body)
    },

    badRequest(message: string) {
      res.status(400).json({ message })
    },

    unauthorized(message?: string) {
      res.status(401).json({ message: message || 'Unauthorized' })
    },

    forbidden(message?: string) {
      res.status(403).json({ message: message || 'Forbidden' })
    },

    notFound(message?: string) {
      res.status(404).json({ message: message || 'Not Found' })
    },

    error(message?: string) {
      res.status(500).json({ message: message || 'Internal Server Error' })
    },
  }
}

/**
 * Convert Next.js request → framework-agnostic IApiRequest.
 */
function nextRequestAdapter(req: NextApiRequest): IApiRequest {
  return {
    query: req.query,
    body: req.body,
    headers: req.headers,
    method: req.method,
  }
}

/**
 * Convert raw NextAuth session.user → normalized backend SessionUser.
 */
function nextUserAdapter(raw: Session['user']): ISessionUser {
  return new SessionUser(
    raw.id ?? '',
    raw.email ?? '',
    raw.name ?? null,
    raw.image ?? null,
    raw.roles ?? [],
    raw.groups ?? [],
    raw.selected_group ?? null
  )
}

/**
 * Unified entry point for all API routes.
 * Builds:
 *   - portable ctx.req / ctx.res (framework-agnostic)
 *   - normalized user from session
 *   - prisma client
 *
 * Usage: ctx.req.query, ctx.req.body, ctx.res.ok(), ctx.res.badRequest(), etc.
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
      req: nextRequestAdapter(nextReq),
      res: nextResponseAdapter(nextRes),
      user: nextUserAdapter(rawUser),
      prisma: getPrismaClient(),
    }

    return handler(ctx)
  }
}
