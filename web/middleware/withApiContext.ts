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
import type {
  ApiContext,
  ApiRequest,
  ApiResponse,
  SessionUser,
} from '@/types/api'
import { getPrismaClient } from '@/code/hooks/usePrisma'
import { getUser } from '@/code/auth/auth'

/* --------------------------------------------------------------------------
 * Migration Notes
 * --------------------------------------------------------------------------
 * This file introduces portable req/res abstractions while keeping raw
 * Next.js objects in ctx.req_raw / ctx.res_raw for old handlers.
 *
 * New handlers:
 *   - use ctx.req, ctx.res, ctx.ok(), ctx.badRequest()
 *
 * Old handlers:
 *   - continue using ctx.req_raw, ctx.res_raw (Next.js-specific)
 *
 * After migration (1 week):
 *   - remove req_raw / res_raw completely
 *   - keep ctx.req / ctx.res as the stable API
 * -------------------------------------------------------------------------- */

/**
 * Convert Next.js response → framework-agnostic ApiResponse.
 */
function nextResponseAdapter(res: NextApiResponse): ApiResponse {
  return {
    status(code: number) {
      res.status(code)
      return this
    },
    json(body: unknown) {
      res.json(body)
    },
  }
}

/**
 * Convert Next.js request → framework-agnostic ApiRequest.
 */
function nextRequestAdapter(req: NextApiRequest): ApiRequest {
  return {
    query: req.query,
    body: req.body,
    headers: req.headers,
    method: req.method,
  }
}

/**
 * Unified entry point for all API routes.
 * Builds:
 *   - portable ctx.req / ctx.res
 *   - raw ctx.req_raw / ctx.res_raw (deprecated)
 *   - user from session (null if not authenticated)
 *   - helper methods: ok(), json(), badRequest()
 */
export function withApiContext(handlers: Record<string, Function>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const handler = handlers[req.method || '']
    if (!handler) {
      return res.status(405).json({ message: 'Method not allowed' })
    }

    const prisma = getPrismaClient()

    // Fetch user from session (null if not authenticated)
    const rawSessionUser = await getUser(req, res)
    let user: SessionUser | null = null

    if (rawSessionUser) {
      const sessionUser = rawSessionUser as SessionUser

      // Normalize session user (ensure required fields have defaults)
      user = {
        id: sessionUser.id,
        email: sessionUser.email || '',
        name: sessionUser.name,
        image: sessionUser.image,
        roles: sessionUser.roles || [],
        groups: sessionUser.groups,
        selected_group: sessionUser.selected_group,
      }
    }

    const ctx: ApiContext = {
      // NEW portable API (final API surface)
      req_new: nextRequestAdapter(req),
      res_new: nextResponseAdapter(res),

      // OLD Next.js objects (temporary, removed after migration)
      // req, res methods should not be accessed directly, a set of methods should be declared
      req: req,
      res: res,

      prisma,
      user,

      json(status, body) {
        this.res_new.status(status).json(body)
      },

      ok(body) {
        this.res_new.status(200).json(body)
      },

      badRequest(message) {
        this.res_new.status(400).json({ message })
      },
    }

    return handler(ctx)
  }
}
