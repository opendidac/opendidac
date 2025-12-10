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

import type { IApiContext } from '@/core/types/api'
import { withApiContext } from '@/middleware/withApiContext'

const get = async (ctx: IApiContext) => {
  const { res } = ctx
  const terms = process.env.TERMS_OF_SERVICE
  if (!terms) return res.status(400).json({ message: 'Terms not configured' })

  return res.status(200).json({ terms })
}

export default withApiContext({
  GET: get,
})
