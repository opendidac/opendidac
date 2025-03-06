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
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

const getSession = async (req, res) => {
  const session = await getServerSession(req, res, authOptions)
  return session
}

const getRoles = async (req, res) => {
  const session = await getSession(req, res)
  return session && session.user && session.user.roles
}

const getUser = async (req, res) => {
  const session = await getSession(req, res)
  return session && session.user
}

export { getSession, getRoles, getUser }
