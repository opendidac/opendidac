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
import { getPrisma } from './withPrisma'
import { UserOnEvaluationAccessMode } from '@prisma/client'
import { getUser } from '@/code/auth/auth'

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

    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
    })

    if (!evaluation) {
      return handler(req, res)
    }

    // Skip IP check for non-student users
    if (req.user && req.user.roles && !req.user.roles.includes(Role.STUDENT)) {
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

    const userEmail = user.email
    // Check if user is in access list
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

    return handler(req, res)
  }
}
