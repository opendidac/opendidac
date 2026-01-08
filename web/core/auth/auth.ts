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

import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import type { Session } from 'next-auth'

/**
 * Temporary adapter to fetch the NextAuth session.
 * Will be deleted once withApiContext becomes the single auth source.
 */
export async function getSession(req: any, res: any): Promise<Session | null> {
  return await getServerSession(req, res, authOptions as any)
}

/**
 * Temporary helper to extract session.user.
 * Will be replaced by direct session access inside withApiContext.
 */
export async function getUser(
  req: any,
  res: any,
): Promise<Session['user'] | null> {
  const session = await getSession(req, res)
  return session?.user ?? null
}

/**
 * Deprecated – kept only to avoid breaking legacy code for now.
 * Remove completely once all endpoints use ctx.user.
 */
export async function getRoles(
  req: any,
  res: any,
): Promise<Session['user']['roles'] | undefined> {
  const session = await getSession(req, res)
  return session?.user?.roles
}
