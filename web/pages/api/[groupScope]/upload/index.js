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
// pages/api/[groupScope]/upload.js

import multer from 'multer'
import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { createId } from '@paralleldrive/cuid2'
import slugify from 'slugify'
import {
  withAuthorization,
  withGroupScope,
  withMethodHandler,
} from '@/middleware/withAuthorization'
import { Role } from '@prisma/client'

const MAX_IMAGE_WIDTH_PX = 1920

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

const SUPPORTED_APPLICATION_TYPES = [
  'pdf',
  'msword',
  'vnd.openxmlformats-officedocument.wordprocessingml.document',
  'vnd.ms-excel',
  'vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'vnd.ms-powerpoint',
  'vnd.openxmlformats-officedocument.presentationml.presentation',
  'csv',
]

const SUPPORTED_IMAGE_TYPES = ['jpeg', 'jpg', 'png', 'gif']

const SUPPORTED_TEXT_TYPES = ['plain', 'csv']

const isSupportedMimeType = (mimetype) => {
  const [type, subtype] = mimetype.split('/')

  switch (type) {
    case 'application':
      return SUPPORTED_APPLICATION_TYPES.includes(subtype)
    case 'image':
      return SUPPORTED_IMAGE_TYPES.includes(subtype)
    case 'text':
      return SUPPORTED_TEXT_TYPES.includes(subtype)
    default:
      return false
  }
}

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const cuidValue = createId()
    const dir = `./assets/${cuidValue}`
    try {
      await fs.mkdir(dir, { recursive: true })
      cb(null, dir)
    } catch (error) {
      cb(error)
    }
  },
  filename: (req, file, cb) => {
    const cuidValue = createId()

    const sanitizedFilename = slugify(file.originalname, {
      lower: true, // Convert to lowercase
      replacement: '-', // Replace spaces and other characters with hyphens
      remove: /[*+~()'"!:@]/g, // Remove characters that are not URL-friendly
    })

    cb(null, sanitizedFilename)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
}).single('file')

const post = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(500).json({ message: 'Upload error: ' + err.message })
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const { mimetype, path: filePath, filename } = req.file

    if (!isSupportedMimeType(mimetype)) {
      await fs.unlink(filePath)
      return res
        .status(400)
        .json({ message: `Unsupported mime type: ${mimetype}` })
    }

    const [type] = mimetype.split('/')

    try {
      if (type === 'image') {
        await processImage(filePath)
      }

      // Replace backslashes with forward slashes
      const normalizedPath = path.dirname(filePath).split(path.sep).join('/')
      const fileUrl = `${req.headers.origin}/api/assets/${normalizedPath
        .split('/')
        .pop()}/${filename}`

      res.status(200).json({ success: true, fileUrl })
    } catch (error) {
      console.error('Error processing file:', error)
      res
        .status(500)
        .json({ message: 'Error processing file: ' + error.message })
    }
  })
}

async function processImage(filePath) {
  const tempFilePath = `${filePath}.tmp`

  await sharp(filePath)
    .resize(MAX_IMAGE_WIDTH_PX, null, {
      fit: sharp.fit.inside,
      withoutEnlargement: true,
    })
    .toFile(tempFilePath) // write to a temporary file

  await fs.rename(tempFilePath, filePath) // replace the original file

  return filePath
}

export default withGroupScope(
  withMethodHandler({
    POST: withAuthorization(post, [Role.PROFESSOR]),
  }),
)

export const config = {
  api: {
    bodyParser: false,
  },
}
