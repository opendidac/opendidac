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
// pages/api/assets/[...path].js

import fs from 'fs'
import path from 'path'
import mime from 'mime'
import { promisify } from 'util'
import {
  withAuthorization,
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { Role } from '@prisma/client'

const stat = promisify(fs.stat)
const readFile = promisify(fs.readFile)

const get = async (req, res) => {
  const { path: filePathArray } = req.query
  const filePath = filePathArray.join('/')

  // Construct the full path to the file
  const fullPath = path.resolve('./assets', filePath)

  try {
    const fileStat = await stat(fullPath)

    if (!fileStat.isFile()) {
      res.status(404).json({ message: 'File not found' })
      return
    }

    const fileContent = await readFile(fullPath)
    const mimeType = mime.getType(fullPath)

    res.setHeader('Content-Type', mimeType)
    res.setHeader('Content-Length', fileStat.size)
    res.status(200).send(fileContent)
  } catch (error) {
    console.error('Error serving file:', error)
    res.status(500).json({ message: 'Error serving file: ' + error.message })
  }
}

export default withMethodHandler({
  GET: withAuthorization(get, [Role.PROFESSOR, Role.SUPER_ADMIN, Role.STUDENT]),
})
