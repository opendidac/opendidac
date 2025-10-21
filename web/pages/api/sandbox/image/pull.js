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
import { Role } from '@prisma/client'

import {
  withAuthorization,
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { pullImage } from '@/sandbox/utils'

const post = async (req, res, prisma) => {
  const { image } = req.body
  // Pull the latest docker image
  try {
    const output = await pullImage(image)
    return res.status(200).json({
      status: 'SUCCESS',
      message: output[output.length - 1]?.status || 'Image pulled successfully',
    })
  } catch (error) {
    console.error('Error pulling image:', error)
    return res.status(500).json({
      status: 'ERROR',
      message: `Error pulling image: ${error.message}`,
    })
  }
}

export default withMethodHandler({
  POST: withAuthorization(post, [Role.PROFESSOR, Role.STUDENT]),
})
