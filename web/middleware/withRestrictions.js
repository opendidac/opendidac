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

// Validate IPv4 addresses only (infrastructure is IPv4-only)
const normalizeIp = (input) => {
  if (!input) return null
  return net.isIP(input) === 4 ? input : null
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

/**
 * Middleware that enforces evaluation access restrictions (IP, desktop app, access list, phase).
 *
 * IMPORTANT: This middleware is ONLY used in student-facing endpoints under /api/users.
 * It applies restrictions to ALL users accessing these endpoints, regardless of their role
 * (students, professors, student assistants). This ensures:
 *
 * 1. Consistency: All users accessing student endpoints are subject to the same restrictions
 * 2. Verification: Professors can verify that IP restrictions and other mechanisms work correctly
 *    when accessing student endpoints (e.g., for testing or monitoring)
 * 3. Security: Student assistants are also restricted, preventing unauthorized access
 *
 * Restrictions enforced:
 * - Evaluation phase must be after COMPOSITION phase
 * - Desktop app requirement (if enabled)
 * - IP address restrictions (if configured)
 * - Access list validation (if LINK_AND_ACCESS_LIST mode is enabled)
 *
 * @requires withPrisma middleware must be called before this middleware
 * @requires withEvaluation middleware must be called before this middleware
 * @param {Function} handler - The route handler to wrap
 * @param {Object} args - Optional configuration arguments
 * @returns {Function} Wrapped handler with restrictions applied
 */
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
      return handler(ctx)
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
      const desktopHeader = req.headers['x-opendidac-desktop']
      const opendidacInUserAgent =
        req.headers['user-agent']?.includes('OpenDidacDesktop')
      const isDesktop = desktopHeader === 'true' && opendidacInUserAgent

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
    return handler(ctx)
  }
}
