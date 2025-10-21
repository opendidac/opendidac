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

import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { Role } from '@prisma/client'
import { getPrisma } from '@/middleware/withPrisma'
import { getSSEClients, invalidateSSEClients } from '@/code/auth/sseClients'

const prisma = getPrisma()
const prismaAdapter = PrismaAdapter(prisma)

const MyAdapter = {
  ...prismaAdapter,
  linkAccount: (account) => {
    account['not_before_policy'] = account['not-before-policy']
    delete account['not-before-policy']
    return prismaAdapter.linkAccount(account)
  },
  deleteSession: async (sessionToken) => {
    try {
      await prisma.session.delete({
        where: { sessionToken },
      })
    } catch (error) {
      if (error.code === 'P2025') {
        return // Ignore if the session doesn't exist
      }
      throw error // Rethrow any other error
    }
  },
}

/* LEGACY
const keycloakProvider = KeycloakProvider({
  clientId: process.env.NEXTAUTH_KEYCLOAK_CLIENT_ID,
  clientSecret: process.env.NEXTAUTH_KEYCLOAK_CLIENT_SECRET,
  issuer: process.env.NEXTAUTH_KEYCLOAK_ISSUER_BASE_URL,
  authorization: {
    params: {
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/keycloak`,
    },
  },
})


const switchLegacyProvider = {
  id: 'switch_legacy',
  name: 'SWITCH edu-ID (legacy)',
  type: 'oauth',
  wellKnown: 'https://login.eduid.ch/.well-known/openid-configuration',
  clientId: process.env.NEXTAUTH_SWITCH_CLIENT_ID,
  clientSecret: process.env.NEXTAUTH_SWITCH_CLIENT_SECRET,
  authorization: {
    params: {
      scope: 'openid profile email https://login.eduid.ch/authz/User.Read',
      claims: JSON.stringify({
        id_token: {
          name: { essential: true },
          email: { essential: true },
          swissEduIDLinkedAffiliation: { essential: true },
          swissEduIDAssociatedMail: { essential: true },
          swissEduIDLinkedAffiliationMail: { essential: true },
          swissEduID: { essential: true },
          eduPersonEntitlement: { essential: true },
          eduPersonAffiliation: { essential: true },
        },
      }),
    },
  },

  idToken: true,
  checks: ['pkce', 'state'],
  profile(OAuthProfile) {
    
    return {
      id: OAuthProfile.sub,
      name: OAuthProfile.name,
      email: OAuthProfile.email,
      image: OAuthProfile.picture,
      roles: [Role.STUDENT],
      affiliations: OAuthProfile.swissEduIDLinkedAffiliationMail,
      organizations: OAuthProfile.swissEduIDLinkedAffiliationMail.map(
        (affiliation) => affiliation.split('@')[1],
      ),
      selectedAffiliation: null,
    }
  },
}

*/

const switchEduId = {
  id: 'switch',
  name: 'SWITCH edu-ID',
  type: 'oauth',
  wellKnown: 'https://login.eduid.ch/.well-known/openid-configuration',
  clientId: process.env.NEXTAUTH_SWITCH_CLIENT_ID,
  clientSecret: process.env.NEXTAUTH_SWITCH_CLIENT_SECRET,
  authorization: {
    params: {
      scope: 'openid profile email https://login.eduid.ch/authz/User.Read',
      claims: JSON.stringify({
        id_token: {
          name: { essential: true },
          email: { essential: true },
          swissEduIDLinkedAffiliation: { essential: true },
          swissEduIDAssociatedMail: { essential: true },
          swissEduIDLinkedAffiliationMail: { essential: true },
          swissEduID: { essential: true },
          eduPersonEntitlement: { essential: true },
          eduPersonAffiliation: { essential: true },
        },
      }),
    },
  },
  idToken: true,
  checks: ['pkce', 'state'],
  style: {
    bg: '#fff', // Light gray background
    text: '#000', // Black text color
  },
  profile(OAuthProfile) {
    const allowedDomains =
      process.env.NEXTAUTH_SWITCH_ORGANIZATION_DOMAINS?.split(',').map(
        (domain) => domain.trim(),
      )

    if (!allowedDomains || allowedDomains.length === 0) {
      throw new Error('Allowed organization domains are not set.')
    }

    const linked = OAuthProfile.swissEduIDLinkedAffiliationMail || []
    const associated = OAuthProfile.swissEduIDAssociatedMail || []

    const allAffiliations = Array.from(new Set([...linked, ...associated]))

    const email = allAffiliations.find((affiliation) =>
      allowedDomains.some((domain) => affiliation.endsWith(domain)),
    )

    if (!email) {
      throw new Error(
        `User does not have an appropriate affiliation for the allowed domains: ${allowedDomains.join(', ')}`,
      )
    }

    const organizations = allAffiliations.map(
      (affiliation) => affiliation.split('@')[1],
    )

    return {
      id: OAuthProfile.sub,
      name: OAuthProfile.name,
      email: email,
      image: OAuthProfile.picture,
      roles: [Role.STUDENT],
      affiliations: linked,
      associated: associated,
      organizations: organizations,
      selectedAffiliation: null,
    }
  },
}

export const authOptions = {
  adapter: MyAdapter,
  providers: [switchEduId],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, user }) {
      if (user) {
        session.user = user
        session.user.id = user.id
        session.user.roles = user.roles

        const userWithGroups = await prisma.user.findUnique({
          where: { email: user.email },
          include: {
            groups: {
              include: {
                group: true,
              },
              orderBy: {
                group: {
                  label: 'asc',
                },
              },
            },
          },
        })

        if (userWithGroups) {
          session.user.groups = userWithGroups.groups.map((g) => g.group.scope)
          session.user.selected_group = userWithGroups.groups.find(
            (g) => g.selected,
          )?.group.scope
        }
      }
      return session
    },

    async signIn({ user, account }) {
      await handleSingleSessionPerUser(user)

      if (
        account.provider === 'keycloak' ||
        account.provider === 'switch' ||
        account.provider === 'switch_legacy'
      ) {
        if (!user.email) {
          return false
        }

        await linkOrCreateUserForAccount(user, account)
        return true
      }

      return false
    },
  },
}

async function handleSingleSessionPerUser(user) {
  const activeSessions = await prisma.session.findMany({
    where: { userId: user.id },
  })

  if (activeSessions.length > 0) {
    await prisma.session.deleteMany({
      where: { userId: user.id },
    })

    // Notify all active SSE clients (tabs) for this user
    invalidateSSEClients(user.id, 'unauthenticated') // forcibly close all SSE streams

    // Close all SSE connections
    for (const res of getSSEClients(user.id)) {
      res.end()
    }
  }
}

async function linkOrCreateUserForAccount(user, account) {
  const accountData = {
    type: account.type,
    provider: account.provider,
    providerAccountId: account.providerAccountId,
    refresh_token: account.refresh_token,
    access_token: account.access_token,
    expires_at: account.expires_at,
    refresh_expires_in: account.refresh_expires_in,
    not_before_policy: account['not-before-policy'],
    token_type: account.token_type,
    scope: account.scope,
    id_token: account.id_token,
    session_state: account.session_state,
  }

  const linkedAccount = await prisma.account.findFirst({
    where: {
      providerAccountId: account.providerAccountId,
      provider: account.provider,
    },
  })

  if (!linkedAccount) {
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email },
    })

    if (!existingUser) {
      const newUser = await prisma.user.create({
        data: {
          email: user.email,
          name: user.name,
          roles: [Role.STUDENT],
        },
      })

      await prisma.account.create({
        data: {
          userId: newUser.id,
          ...accountData,
        },
      })
      return newUser
    } else {
      await prisma.account.create({
        data: {
          userId: existingUser.id,
          ...accountData,
        },
      })

      return existingUser
    }
  }
}

export default NextAuth(authOptions)
