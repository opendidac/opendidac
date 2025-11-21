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

/* --------------------------------------------------------------------------
 * FRAMEWORK-AGNOSTIC RESPONSE
 * -------------------------------------------------------------------------- */
export interface ApiResponse {
  status(code: number): this
  json(body: unknown): void
}

/* --------------------------------------------------------------------------
 * FRAMEWORK-AGNOSTIC REQUEST
 * -------------------------------------------------------------------------- */
export interface ApiRequest {
  query: Record<string, unknown>
  body?: unknown
  headers: Record<string, string | string[] | undefined>
  method?: string
}

/* --------------------------------------------------------------------------
 * BASE API CONTEXT (portable)
 * -------------------------------------------------------------------------- */
export interface ApiContext {
  /** NEW portable request */
  req_new: ApiRequest

  /** NEW portable response */
  res_new: ApiResponse

  /** OLD raw Next.js objects (temporary during migration) */
  req?: any
  res?: any
  __legacy?: boolean

  prisma: PrismaClient

  /** Authenticated user (null if not authenticated) */
  user: SessionUser | null

  json(status: number, body: unknown): void
  ok(body: unknown): void
  badRequest(message: string): void
}

import type { PrismaClient, Role, Prisma } from '@prisma/client'
import { evaluationContextSelect } from '@/middleware/withEvaluation'

/* --------------------------------------------------------------------------
 * SESSION USER (from NextAuth session callback)
 * -------------------------------------------------------------------------- */
/**
 * Type describing the raw user object coming from NextAuth session callback.
 * This is NOT stored in DB, this is the user injected into session.user.
 * Used directly in ApiContext after normalization (email defaults to '' if missing).
 */
export interface SessionUser {
  id: string
  email: string // Normalized: defaults to '' if missing from session
  name?: string | null
  image?: string | null
  roles: Role[] // Normalized: defaults to [] if missing
  groups?: string[]
  selected_group?: string | null
}

/* --------------------------------------------------------------------------
 * evaluation in context (generated from select)
 * -------------------------------------------------------------------------- */
type RawEvaluationInContext = Prisma.EvaluationGetPayload<{
  select: typeof evaluationContextSelect
}>

export interface EvaluationInContext extends RawEvaluationInContext {}

/* --------------------------------------------------------------------------
 * Extended context shapes for middleware chaining
 * -------------------------------------------------------------------------- */
export interface ApiContextWithRoles extends ApiContext {
  roles: Role[]
}

export interface ApiContextWithEvaluation extends ApiContext {
  evaluation: EvaluationInContext
}

export interface ApiContextWithUserAndRoles extends ApiContextWithRoles {
  user: SessionUser // Non-null user
}

export interface ApiContextWithUserAndEvaluation
  extends ApiContextWithEvaluation {
  user: SessionUser // Non-null user
}

export interface ApiContextWithRolesAndEvaluation
  extends ApiContextWithRoles,
    ApiContextWithEvaluation {}

export interface ApiContextWithUserRolesAndEvaluation
  extends ApiContextWithRoles,
    ApiContextWithEvaluation {
  user: SessionUser // Non-null user
}

export type ExtendedApiContext =
  | ApiContext
  | ApiContextWithRoles
  | ApiContextWithEvaluation
  | ApiContextWithUserAndRoles
  | ApiContextWithUserAndEvaluation
  | ApiContextWithRolesAndEvaluation
  | ApiContextWithUserRolesAndEvaluation
