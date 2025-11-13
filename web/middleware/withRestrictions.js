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

import { EvaluationPhase, Role } from '@prisma/client'
import { getPrisma } from './withPrisma'
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

export const withRestrictions = (handler) => {
  return async (req, res) => {
    const prisma = getPrisma()
    const { evaluationId } = req.query
    const user = await getUser(req, res)

    // If evaluationId is missing, pass through (let the handler deal with it)
    if (!evaluationId) {
      return handler(req, res)
    }

    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      // Explicitly select desktopAppRequired to ensure it's always included
      select: {
        id: true,
        phase: true,
        desktopAppRequired: true,
        ipRestrictions: true,
        accessMode: true,
        accessList: true,
      },
    })

    // If evaluation not found, pass through (let the handler return 404)
    if (!evaluation) {
      return handler(req, res)
    }

    // All student actions are restricted before the registration phase
    if (!phaseGT(evaluation.phase, EvaluationPhase.COMPOSITION)) {
      return res.status(400).json({
        type: 'error',
        id: 'not-ready',
        message: 'This evaluation is not joinable',
      })
    }

    // Check if desktop app is required - this applies to ALL users (students and non-students)
    // This check must happen before the non-student early return
    if (evaluation.desktopAppRequired) {
      const rawUserAgent = req.headers['user-agent'] || ''
      const userAgent = rawUserAgent.toLowerCase()
      const desktopAppHeader = req.headers['x-opendidac-desktop'] || ''
      
      // Check both user agent (case-insensitive) and custom header for robustness
      const hasUserAgent = userAgent.includes('opendidacdesktop')
      const hasCustomHeader = desktopAppHeader === 'true' || desktopAppHeader === '1'
      
      if (!hasUserAgent && !hasCustomHeader) {
        // Log access denial for production monitoring (this should not happen in normal flow)
        console.warn('[Desktop App Restriction] Access denied:', {
          evaluationId: evaluation.id,
          userAgent: rawUserAgent || 'missing',
          customHeader: desktopAppHeader || 'missing',
          ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          userEmail: user?.email || 'anonymous',
          userRoles: user?.roles || [],
        })
        
        return res.status(401).json({
          type: 'error',
          id: 'desktop-app-required',
          message:
            'This evaluation requires the OpenDidac desktop application. Please use the desktop app to access this evaluation.',
        })
      }
    }

    // Skip IP check for non-student users (but desktop app check already happened above)
    if (user && user.roles && !user.roles.includes(Role.STUDENT)) {
      return handler(req, res)
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress

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

    const userEmail = user?.email

    // Check if user is in access list (only if user is authenticated)
    if (userEmail) {
      const isAllowedAccessList = await isUserInAccessList(
        userEmail,
        evaluation,
        prisma,
      )
      if (!isAllowedAccessList) {
        return res.status(401).json({
          type: 'info',
          id: 'access-list',
          message:
            'Your attempt to access this evaluation has been registered. Awaiting approval.',
        })
      }
    }

    return handler(req, res)
  }
}
