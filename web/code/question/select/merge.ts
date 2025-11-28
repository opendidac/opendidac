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

/**
 * Deep merge for any Prisma select object.
 *
 * NOTE:
 * -----
 * Prisma select trees contain mixed value types:
 * - booleans
 * - nested objects
 * - nested { select: {...} } / { include: {...} }
 * - undefined branches
 * - various Prisma-generated "FindManyArgs" shapes
 *
 * These structures are NOT representable as a single strict TS type.
 * Therefore the merge internals must use `any` to avoid rejecting valid
 * Prisma select nodes. The public API remains strongly typed through the
 * generic <T extends Record<string, unknown>> constraint.
 */
export const mergeSelects = <T extends Record<string, any>>(
  ...parts: T[]
): T => {
  const result = {} as T

  for (const part of parts) {
    deepMerge(result, part)
  }

  return result
}

/**
 * Internal deep-merge helper.
 * Uses Record<string, any> because Prisma select trees contain mixed,
 * non-JSON-serializable shapes that cannot be modeled strictly.
 */
const deepMerge = (
  target: Record<string, any>,
  source: Record<string, any>,
) => {
  for (const key of Object.keys(source)) {
    const src = source[key]
    const tgt = target[key]

    if (isPlainObject(tgt) && isPlainObject(src)) {
      deepMerge(tgt, src)
      continue
    }

    target[key] = src
  }
}

/**
 * Checks for a plain object.
 * Must allow any for flexibility in Prisma nested select structures.
 */
const isPlainObject = (v: any): v is Record<string, any> => {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}
