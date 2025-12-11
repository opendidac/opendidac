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
import type { PrismaClient, Role, Prisma } from '@prisma/client'
import { evaluationContextSelect } from '@/middleware/withEvaluation'

/* --------------------------------------------------------------------------
 * BASE API CONTEXT
 * -------------------------------------------------------------------------- */
export interface IApiContext {
  prisma: PrismaClient

  /** Authenticated user from NextAuth session */
  user: Session['user']
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
