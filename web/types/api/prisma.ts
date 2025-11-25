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
 * Identity helper to preserve the full inferred TypeScript type of a dynamic
 * Prisma `select` object without erasing types via `as any` or pretending it
 * matches the static `Prisma.XSelect` type.
 *
 * Why this is needed:
 * -------------------
 * Prisma requires a `select` object with a valid shape at runtime, but large
 * dynamic builders (like questionSelectClause) produce nested conditional
 * selects that cannot be expressed as a single static Prisma type.
 *
 * This helper preserves the *actual* inferred type exactly as returned by the
 * builder and passes it through unchanged, allowing:
 *   - full TypeScript inference on the returned object
 *   - structural validation by TypeScript
 *   - runtime validation by Prisma (invalid fields still throw)
 *   - zero `as any` needed
 *
 * It is the safest way to pass complex, dynamic `select` objects into Prisma.
 */
export const asPrismaSelect = <T extends object>(select: T): T => select;
