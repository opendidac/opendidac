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

import net from 'net'
import { EvaluationPhase } from '@prisma/client'
import { UserOnEvaluationAccessMode } from '@prisma/client'
import { getUser } from '@/code/auth/auth'
import { phaseGT } from '@/code/phase'

const isIpInRange = (ip, range) => {
  // Handle CIDR notation
  if (range.includes('/')) {
    const [baseIp, bits] = range.split('/')
    const mask = ~((1 << (32 - parseInt(bits))) - 1)
    const ipNum = ip
      .split('.')
      .reduce((num, oct) => (num << 8) + parseInt(oct), 0)
    const rangeNum = baseIp
      .split('.')
      .reduce((num, oct) => (num << 8) + parseInt(oct), 0)
    return (ipNum & mask) === (rangeNum & mask)
  }

  // Handle IP range with hyphen
  if (range.includes('-')) {
    const [start, end] = range.split('-')
    const ipNum = ip
      .split('.')
      .reduce((num, oct) => (num << 8) + parseInt(oct), 0)
    const startNum = start
      .split('.')
      .reduce((num, oct) => (num << 8) + parseInt(oct), 0)
    const endNum = end
      .split('.')
      .reduce((num, oct) => (num << 8) + parseInt(oct), 0)
    return ipNum >= startNum && ipNum <= endNum
  }

  // Single IP address
  return ip === range
}

const isIpAllowed = (ip, restrictions) => {
  if (!restrictions) return true

  const ranges = restrictions.split(',').map((r) => r.trim())
  return ranges.some((range) => isIpInRange(ip, range))
}

const extractClientIp = (req) => {
  const xff = req.headers['x-forwarded-for']

  if (typeof xff === 'string' && xff.length > 0) {
    const raw = xff.split(',')[0].trim() // leftmost entry only
    const ip = normalizeIp(raw)
    if (ip !== null) return ip
  }

  const socketIp = req.socket?.remoteAddress || ''
  return normalizeIp(socketIp) ?? socketIp
}

// Strip IPv6 zone, decode IPv4-mapped IPv6, and validate IP
const normalizeIp = (input) => {
  if (!input) return null

  const noZone = input.includes('%') ? input.split('%')[0] : input

  if (noZone.startsWith('::ffff:')) {
    const v4 = noZone.slice(7)
    return net.isIP(v4) === 4 ? v4 : null
  }

  return net.isIP(noZone) ? noZone : null
}

const isDesktopAppRequest = (req) => {
  // Check for the custom header that the desktop app sends
  const desktopHeader = req.headers['x-opendidac-desktop']
  const opendidaInUserAgent =
    req.headers['user-agent']?.includes('OpenDidacDesktop')
  return desktopHeader === 'true' && opendidaInUserAgent
}

export const isUserInAccessList = async (userEmail, evaluation, prisma) => {
  if (
    evaluation.accessMode === UserOnEvaluationAccessMode.LINK_AND_ACCESS_LIST &&
    !evaluation.accessList?.includes(userEmail)
  ) {
    await prisma.userOnEvaluationDeniedAccessAttempt.upsert({
      where: {
        userEmail_evaluationId: {
          userEmail,
          evaluationId: evaluation.id,
        },
      },
      update: {},
      create: {
        userEmail,
        evaluationId: evaluation.id,
      },
    })
    return false
  }
  return true
}

export const withRestrictions = (handler, args = {}) => {
  return async (ctx) => {
    const { req, res, prisma, evaluation } = ctx
    const { evaluationId } = req.query
    const user = await getUser(req, res)

    if (!prisma) {
      return res.status(500).json({
        type: 'error',
        message:
          'Prisma client not available. Did you call withPrisma middleware?',
      })
    }

    if (!evaluationId) {
      return handler(ctx, args)
    }

    if (!evaluation) {
      return res.status(500).json({
        type: 'error',
        message:
          'Evaluation not found in context. Did you call withEvaluation middleware before withRestrictions?',
      })
    }

    // ---- RULE 1: Evaluation Phase ---- (independent)
    if (!phaseGT(evaluation.phase, EvaluationPhase.COMPOSITION)) {
      return res.status(400).json({
        type: 'error',
        id: 'not-ready',
        message: 'This evaluation is not joinable',
      })
    }

    // ---- RULE 2: Desktop App Restriction ---- (independent)
    if (evaluation.desktopAppRequired) {
      const isDesktop = isDesktopAppRequest(req)

      if (!isDesktop) {
        console.warn('[Desktop App Restriction] Access denied:', {
          evaluationId: evaluation.id,
          userAgent: req.headers['user-agent'] || 'missing',
          customHeader: req.headers['x-opendidac-desktop'] || 'missing',
          ip: extractClientIp(req),
          userEmail: user?.email || 'anonymous',
          roles: user?.roles || [],
        })

        return res.status(401).json({
          type: 'error',
          id: 'desktop-app-required',
          message:
            'This evaluation requires the OpenDidac desktop application. Please use the desktop app to access this evaluation.',
        })
      }
    }

    // ---- RULE 3: IP Restriction ---- (independent)
    const clientIp = extractClientIp(req)

    if (
      evaluation.ipRestrictions &&
      !isIpAllowed(clientIp, evaluation.ipRestrictions)
    ) {
      return res.status(401).json({
        type: 'error',
        id: 'ip-restriction',
        message: `Access denied: Your IP address ${clientIp} is not allowed to access this evaluation`,
      })
    }

    // ---- RULE 4: Access List ---- (independent)
    const userEmail = user?.email?.toLowerCase()

    if (userEmail) {
      const allowed = await isUserInAccessList(userEmail, evaluation, prisma)

      if (!allowed) {
        return res.status(401).json({
          type: 'info',
          id: 'access-list',
          message:
            'Your attempt to access this evaluation has been registered. Awaiting approval.',
        })
      }
    }

    // ---- PASS THROUGH WHEN ALL RULES OK ----
    return handler(ctx, args)
  }
}
