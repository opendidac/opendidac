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

import type { Role } from '@prisma/client'
import type { IApiContext, IApiContextWithRoles } from '@/types/api'

/**
 * Group owned entities are entities that are owned by a group.
 *
 * - Collection
 * - Evaluation
 * - Question
 * - Tag
 *
 * When the entity or any of its related entities are concerned, we must ensure that the user is the member of that group.
 */
const EntityNameQueryStringIdPair = {
  Question: 'questionId',
  Collection: 'collectionId',
  Evaluation: 'evaluationId',
  Tag: 'tagId',
} as const

type EntityName = keyof typeof EntityNameQueryStringIdPair
type EntityModelName = Lowercase<EntityName>

/**
 * Function to check if a user is member of the group
 * for group scoped endpoints
 *
 * This function also checks
 * - if the entity is owned by the group
 * - if the user is member of the group that owns the entity
 *
 * It automatically detects the entity usage based on the query string.
 * Important: Always use the singular form of the entity id variable name in the query string.
 */
export function withGroupScope<T extends IApiContext>(
  handler: (ctx: T) => Promise<any>,
  args: Record<string, unknown> = {},
) {
  return async (ctx: T): Promise<any> => {
    const { req, res } = ctx

    if (!req || !res) {
      return res
        .status(500)
        .json({ message: 'Request or response not available in context.' })
    }

    const { groupScope } = req.query

    if (!groupScope) {
      return res.status(400).json({ message: 'Group scope is required' })
    }

    // Use context user which has groups information
    const { user } = ctx

    const isMember = user.groups?.some((g: string) => g === groupScope)

    if (!isMember) {
      return res
        .status(401)
        .json({ message: 'You are not authorized to access this group' })
    }

    // Identify the entity name and ID from the query string
    const entityPair = Object.entries(EntityNameQueryStringIdPair).find(
      ([, queryStringId]) => req.query[queryStringId],
    ) as [EntityName, string] | undefined

    if (entityPair) {
      // A group owned entity or any of its related entities are concerned
      const [entityName, queryStringId] = entityPair
      const entityId = req.query[queryStringId]

      if (!entityId) {
        return res.status(400).json({ message: 'Entity id is required' })
      }

      // Get prisma from context
      const { prisma } = ctx

      if (!prisma) {
        return res
          .status(500)
          .json({ message: 'Prisma client not available in context.' })
      }

      // Map entity name to Prisma model name (lowercase)
      const modelName = entityName.toLowerCase() as EntityModelName as
        | 'question'
        | 'collection'
        | 'evaluation'
        | 'tag'

      const entity = await (prisma[modelName] as any).findUnique({
        where: {
          id: entityId as string,
        },
        include: {
          group: true,
        },
      })

      if (!entity) {
        return res.status(404).json({ message: 'Entity not found' })
      }

      // Check if the entity group corresponds to the current group
      if (groupScope !== entity.group.scope) {
        return res
          .status(401)
          .json({ message: 'Entity does not belong to the group' })
      }

      // Check if the user is member of the group that owns the entity
      if (!user || !user.groups?.includes(entity.group.scope)) {
        return res
          .status(401)
          .json({ message: 'You are not authorized to access this entity' })
      }
    }

    return handler(ctx)
  }
}

export interface WithAuthorizationOptions {
  roles?: Role[]
}

/**
 * Middleware that checks if the user has the required roles.
 * Adds roles to the context as IApiContextWithRoles.
 */
export function withAuthorization<T extends IApiContext>(
  handler: (ctx: T & IApiContextWithRoles) => Promise<any>,
  options: WithAuthorizationOptions = {},
): (ctx: T) => Promise<any> {
  const { roles: allowedRoles = [] } = options

  return async (ctx: T): Promise<any> => {
    const { res, user } = ctx

    if (!res) {
      throw new Error('Response not available in context.')
    }

    const userRoles = user.roles

    if (!userRoles || userRoles.length === 0) {
      return res
        .status(401)
        .json({ message: 'You must have a role to access this page' })
    }

    const isAuthorized = userRoles.some((userRole: Role) =>
      allowedRoles.includes(userRole),
    )

    if (!isAuthorized) {
      return res.status(401).json({
        message: `You must have one of the following roles: ${allowedRoles.join(', ')}`,
      })
    }

    // Add roles to context
    const ctxWithRoles: T & IApiContextWithRoles = {
      ...ctx,
      roles: userRoles,
    }

    return handler(ctxWithRoles)
  }
}
