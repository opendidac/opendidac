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

export const withIpRestriction = (handler) => {
  return async (req, res) => {
    const evaluation = req.evaluation // Assuming evaluation is attached by a previous middleware

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
      return res.status(403).json({
        message:
          'Access denied: Your IP address is not allowed to access this evaluation',
      })
    }

    return handler(req, res)
  }
}
