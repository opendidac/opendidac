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

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { withRestrictions } from './withRestrictions'
import { Role } from '@prisma/client'

describe('withIpRestriction Middleware', () => {
  let mockHandler
  let mockReq
  let mockRes

  beforeEach(() => {
    mockHandler = vi.fn()
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }
    mockReq = {
      headers: {},
      socket: {},
      user: {},
      evaluation: null,
    }
  })

  it('should call handler when no evaluation is present', async () => {
    await withRestrictions(mockHandler)(mockReq, mockRes)
    expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes)
  })

  it('should call handler for non-student users regardless of IP', async () => {
    mockReq.evaluation = { ipRestrictions: '192.168.1.0/24' }
    mockReq.user = { roles: [Role.PROFESSOR] }
    mockReq.socket.remoteAddress = '10.0.0.1'

    await withRestrictions(mockHandler)(mockReq, mockRes)
    expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes)
  })

  describe('IP Restrictions', () => {
    beforeEach(() => {
      mockReq.user = { roles: [Role.STUDENT] }
    })

    it('should allow access when IP matches single IP restriction', async () => {
      mockReq.evaluation = { ipRestrictions: '192.168.1.1' }
      mockReq.socket.remoteAddress = '192.168.1.1'

      await withRestrictions(mockHandler)(mockReq, mockRes)
      expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes)
    })

    it('should allow access when IP is within CIDR range', async () => {
      mockReq.evaluation = { ipRestrictions: '192.168.1.0/24' }
      mockReq.socket.remoteAddress = '192.168.1.100'

      await withRestrictions(mockHandler)(mockReq, mockRes)
      expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes)
    })

    it('should allow access when IP is within hyphen range', async () => {
      mockReq.evaluation = { ipRestrictions: '192.168.1.1-192.168.1.10' }
      mockReq.socket.remoteAddress = '192.168.1.5'

      await withRestrictions(mockHandler)(mockReq, mockRes)
      expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes)
    })

    it('should allow access when IP matches one of multiple ranges', async () => {
      mockReq.evaluation = {
        ipRestrictions: '192.168.1.0/24, 10.0.0.0/8, 172.16.0.0/12',
      }
      mockReq.socket.remoteAddress = '10.10.10.10'

      await withRestrictions(mockHandler)(mockReq, mockRes)
      expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes)
    })

    it('should deny access when IP is outside allowed ranges', async () => {
      mockReq.evaluation = { ipRestrictions: '192.168.1.0/24' }
      mockReq.socket.remoteAddress = '10.0.0.1'

      await withRestrictions(mockHandler)(mockReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        type: 'error',
        id: 'ip-restriction',
      })
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should handle x-forwarded-for header', async () => {
      mockReq.evaluation = { ipRestrictions: '192.168.1.0/24' }
      mockReq.headers['x-forwarded-for'] = '192.168.1.100'

      await withRestrictions(mockHandler)(mockReq, mockRes)
      expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes)
    })
  })
})
