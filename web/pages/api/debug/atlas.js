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

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    res.status(405).json({ message: 'Method Not Allowed' })
    return
  }

  // Hint the browser to send Client Hints on subsequent requests
  // Note: Effect depends on HTTPS and browser support
  res.setHeader(
    'Accept-CH',
    [
      'Sec-CH-UA',
      'Sec-CH-UA-Full-Version',
      'Sec-CH-UA-Platform',
      'Sec-CH-UA-Mobile',
      'Sec-CH-UA-Model',
      'Sec-CH-UA-Arch',
      'Sec-CH-UA-Bitness',
    ].join(', '),
  )
  res.setHeader(
    'Vary',
    [
      'Sec-CH-UA',
      'Sec-CH-UA-Full-Version',
      'Sec-CH-UA-Platform',
      'Sec-CH-UA-Mobile',
      'Sec-CH-UA-Model',
    ].join(', '),
  )

  const ua = (req.headers['user-agent'] || '').toString()
  const chUa = (req.headers['sec-ch-ua'] || '').toString()
  const chUaFullVersion = (
    req.headers['sec-ch-ua-full-version'] || ''
  ).toString()
  const chUaPlatform = (req.headers['sec-ch-ua-platform'] || '').toString()
  const chUaMobile = (req.headers['sec-ch-ua-mobile'] || '').toString()
  const chUaModel = (req.headers['sec-ch-ua-model'] || '').toString()

  const lowerUa = ua.toLowerCase()
  const lowerChUa = chUa.toLowerCase()

  const isAtlas = lowerUa.includes('atlas') || lowerChUa.includes('atlas')

  const brands = []
  try {
    // Parse brand tokens from Sec-CH-UA, e.g.: "\"Chromium\";v=\"124\", \"Atlas\";v=\"1\""
    chUa
      .split(',')
      .map((s) => s.trim())
      .forEach((token) => {
        const match = token.match(/\"([^\"]+)\";v=\"?([^\"]+)\"?/)
        if (match) brands.push({ brand: match[1], version: match[2] })
      })
  } catch (_) {}

  res.status(200).json({
    ok: true,
    detected: {
      atlas: isAtlas,
    },
    headers: {
      userAgent: ua,
      secChUa: chUa,
      secChUaFullVersion: chUaFullVersion,
      secChUaPlatform: chUaPlatform,
      secChUaMobile: chUaMobile,
      secChUaModel: chUaModel,
    },
    parsed: {
      brands,
    },
    note: 'Heuristic only. UA/Client Hints can be spoofed. Use for telemetry/UX, not security decisions.',
  })
}
