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

import { getPrismaClient } from '@/code/hooks/usePrisma'

export function withApiContext(methodHandlers) {
  return async (req, res) => {
    const handler = methodHandlers[req.method]
    if (!handler) {
      return res.status(405).json({ message: 'Method not allowed' })
    }

    // initialise the context, entry point for all API endpoints
    const ctx = { req, res, prisma: getPrismaClient() }
    await handler(ctx)
  }
}
