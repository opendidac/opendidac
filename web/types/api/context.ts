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

import type { PrismaClient, Role, Prisma } from '@prisma/client'
import { evaluationContextSelect } from '@/middleware/withEvaluation'

/* --------------------------------------------------------------------------
 * FRAMEWORK-AGNOSTIC RESPONSE
 * -------------------------------------------------------------------------- */
export interface IApiResponse {
  /**
   * Send a JSON response with a specific status code.
   * Single method approach (no chaining) for framework compatibility.
   */
  response(status: number, body: unknown): void

  /**
   * Shortcut for 200 OK response.
   */
  ok(body: unknown): void

  /**
   * Shortcut for 400 Bad Request response.
   */
  badRequest(message: string): void

  /**
   * Shortcut for 401 Unauthorized response.
   */
  unauthorized(message?: string): void

  /**
   * Shortcut for 403 Forbidden response.
   */
  forbidden(message?: string): void

  /**
   * Shortcut for 404 Not Found response.
   */
  notFound(message?: string): void

  /**
   * Shortcut for 500 Internal Server Error response.
   */
  error(message?: string): void
}

/* --------------------------------------------------------------------------
 * FRAMEWORK-AGNOSTIC REQUEST
 * -------------------------------------------------------------------------- */
export interface IApiRequest {
  query: Record<string, unknown>
  body?: unknown
  headers: Record<string, string | string[] | undefined>
  method?: string
}

/* --------------------------------------------------------------------------
 * BASE API CONTEXT (portable)
 * -------------------------------------------------------------------------- */
export interface IApiContext {
  /** Portable request (framework-agnostic) */
  req: IApiRequest

  /** Portable response (framework-agnostic) */
  res: IApiResponse

  prisma: PrismaClient

  /** Authenticated user */
  user: ISessionUser
}

/* --------------------------------------------------------------------------
 * SESSION USER (from NextAuth session callback)
 * -------------------------------------------------------------------------- */
/**
 * Type describing the raw user object coming from NextAuth session callback.
 * This is NOT stored in DB, this is the user injected into session.user.
 * Used directly in IApiContext after normalization (email defaults to '' if missing).
 */
export interface ISessionUser {
  id: string
  email: string // Normalized: defaults to '' if missing from session
  name?: string | null
  image?: string | null
  groups?: string[]
  selected_group?: string | null
  roles: Role[]
}

/**
 * Implementation of ISessionUser.
 * Can be immutable since a new instance is created for each request
 * ie: switching groups will be effective for next api calls
 */
export class SessionUser implements ISessionUser {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string | null,
    public readonly image: string | null,
    public readonly roles: Role[],
    public readonly groups: string[] | undefined,
    public readonly selected_group: string | null,
  ) {}
}

/* --------------------------------------------------------------------------
 * evaluation in context (generated from select)
 * This select is a public contract as the evaluation object is provided to handleers and middlewares
 * We wont do the same for all selects
 * -------------------------------------------------------------------------- */
type RawEvaluationInContext = Prisma.EvaluationGetPayload<{
  select: typeof evaluationContextSelect
}>

export interface IEvaluationInContext extends RawEvaluationInContext {}

/* --------------------------------------------------------------------------
 * Extended context shapes for middleware chaining
 * -------------------------------------------------------------------------- */
export interface IApiContextWithRoles extends IApiContext {
  roles: Role[]
}

export interface IApiContextWithEvaluation extends IApiContext {
  evaluation: IEvaluationInContext
}
