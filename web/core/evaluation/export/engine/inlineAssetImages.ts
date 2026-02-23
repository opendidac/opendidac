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

import fs from 'fs/promises'
import path from 'path'
import mime from 'mime'

const IMG_TAG_REGEX = /<img\b[^>]*?\bsrc=(["'])(.*?)\1[^>]*>/gi
const ASSETS_ROUTE_PREFIX = '/api/assets/'

function resolveAssetPathFromSrc(src: string): string | null {
  try {
    // works with absolute paths (in our case its always absolute)
    const url = new URL(src) 
    if (!url.pathname.startsWith(ASSETS_ROUTE_PREFIX)) return null

    const relativeAssetPath = decodeURIComponent(
      url.pathname.slice(ASSETS_ROUTE_PREFIX.length),
    )
    if (!relativeAssetPath) return null

    const assetsRoot = path.resolve(process.cwd(), 'assets')
    const candidatePath = path.resolve(assetsRoot, relativeAssetPath)
    const rootWithSeparator = assetsRoot.endsWith(path.sep)
      ? assetsRoot
      : `${assetsRoot}${path.sep}`

    if (
      candidatePath !== assetsRoot &&
      !candidatePath.startsWith(rootWithSeparator)
    ) {
      return null
    }

    return candidatePath
  } catch {
    return null
  }
}

async function inlineImageTag(tag: string, src: string): Promise<string> {
  const assetPath = resolveAssetPathFromSrc(src)
  if (!assetPath) return tag

  try {
    const content = await fs.readFile(assetPath)
    const contentType = mime.getType(assetPath) || 'application/octet-stream'
    const dataUri = `data:${contentType};base64,${content.toString('base64')}`
    return tag.replace(src, dataUri)
  } catch {
    return tag
  }
}

/**
 * Replace uploaded asset image URLs (`/api/assets/...`) by data-URIs so
 * Puppeteer can render images in PDF without session-bound HTTP requests.
 */
export async function inlineAssetImagesInHtml(html: string): Promise<string> {
  const matches = Array.from(html.matchAll(IMG_TAG_REGEX))
  if (matches.length === 0) return html

  const chunks: string[] = []
  let cursor = 0

  for (const match of matches) {
    const [tag, , src] = match
    const matchIndex = match.index ?? -1
    if (matchIndex < 0) continue

    chunks.push(html.slice(cursor, matchIndex))
    chunks.push(await inlineImageTag(tag, src))
    cursor = matchIndex + tag.length
  }

  chunks.push(html.slice(cursor))
  return chunks.join('')
}
