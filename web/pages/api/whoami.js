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
  res.setHeader('Cache-Control', 'no-store')
  // Advertise Client Hints for richer user agent details (works on secure contexts)
  res.setHeader(
    'Accept-CH',
    [
      'Sec-CH-UA',
      'Sec-CH-UA-Arch',
      'Sec-CH-UA-Bitness',
      'Sec-CH-UA-Full-Version',
      'Sec-CH-UA-Mobile',
      'Sec-CH-UA-Model',
      'Sec-CH-UA-Platform',
      'Sec-CH-UA-Platform-Version',
      'Sec-CH-UA-Form-Factor', // newer Chrome hint
      'Sec-CH-UA-WoW64', // rarely exposed outside custom Chromium builds
    ].join(', '),
  )
  res.setHeader('Vary', 'User-Agent, Sec-CH-UA, Sec-CH-UA-Platform')

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const forwardedFor = req.headers['x-forwarded-for']
    const ipList = Array.isArray(forwardedFor)
      ? forwardedFor
      : (forwardedFor || '')
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean)

    console.log('req.headers', req.headers)

    const ipFromSocket =
      req.socket && req.socket.remoteAddress
        ? req.socket.remoteAddress
        : undefined
    const clientIp = ipList[0] || ipFromSocket || null

    const userAgentHeader = req.headers['user-agent'] || null
    const acceptLanguage = req.headers['accept-language'] || null
    const referer = req.headers['referer'] || req.headers['referrer'] || null
    const host = req.headers['host'] || null
    const protocol =
      req.headers['x-forwarded-proto'] ||
      (req.connection && req.connection.encrypted ? 'https' : 'http') ||
      null

    const vercelCountry = req.headers['x-vercel-ip-country'] || null
    const vercelCity = req.headers['x-vercel-ip-city'] || null
    const vercelRegion = req.headers['x-vercel-ip-country-region'] || null

    const info = {
      method: req.method,
      path: req.url,
      host,
      protocol,
      ip: clientIp,
      ips: ipList.length ? ipList : undefined,
      userAgent: userAgentHeader,
      acceptedLanguages: acceptLanguage,
      referrer: referer,
      geo:
        vercelCountry || vercelCity || vercelRegion
          ? {
              country: vercelCountry,
              city: vercelCity,
              region: vercelRegion,
            }
          : undefined,
      headers: {
        'accept-language': acceptLanguage,
        'user-agent': userAgentHeader,
        'x-forwarded-for': forwardedFor || undefined,
        'x-forwarded-proto': req.headers['x-forwarded-proto'] || undefined,
        'x-real-ip': req.headers['x-real-ip'] || undefined,
        // Client Hints (may require HTTPS and a reload after first response)
        'sec-ch-ua': req.headers['sec-ch-ua'] || undefined,
        'sec-ch-ua-mobile': req.headers['sec-ch-ua-mobile'] || undefined,
        'sec-ch-ua-platform': req.headers['sec-ch-ua-platform'] || undefined,
        'sec-ch-ua-platform-version':
          req.headers['sec-ch-ua-platform-version'] || undefined,
        'sec-ch-ua-model': req.headers['sec-ch-ua-model'] || undefined,
        'sec-ch-ua-arch': req.headers['sec-ch-ua-arch'] || undefined,
        'sec-ch-ua-bitness': req.headers['sec-ch-ua-bitness'] || undefined,
        'sec-ch-ua-full-version':
          req.headers['sec-ch-ua-full-version'] || undefined,
      },
    }

    return res.status(200).json(info)
  } catch (error) {
    return res.status(500).json({ error: 'Failed to read client information' })
  }
}
