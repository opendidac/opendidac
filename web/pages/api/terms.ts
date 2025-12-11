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
import { ApiResponse } from '@/core/types/api'


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<string>>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ code: 'method_not_allowed', message: 'Method not allowed' })
  }
  const terms = process.env.TERMS_OF_SERVICE
  console.log('Terms of service:', terms)
  if (!terms) {
    return res.status(400).json({ code: 'terms_not_configured', message: 'Terms not configured' })
  }
  return res.status(200).json(terms)
}