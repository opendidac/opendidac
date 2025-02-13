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
import KeycloakProvider from 'next-auth/providers/keycloak'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { Role } from '@prisma/client'
import { getPrisma } from '@/middleware/withPrisma'

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

const keycloakProvider = KeycloakProvider({
  clientId: process.env.NEXTAUTH_KEYCLOAK_CLIENT_ID,
  clientSecret: process.env.NEXTAUTH_KEYCLOAK_CLIENT_SECRET,
  issuer: process.env.NEXTAUTH_KEYCLOAK_ISSUER_BASE_URL,
  authorization: {
    params: {
      scope: 'openid profile email',
    },
  },
  profile(profile) {
    return {
      id: profile.sub,
      name: profile.name || profile.preferred_username,
      email: profile.email,
      image: profile.picture,
      roles: profile.realm_access?.roles?.includes('admin')
        ? [Role.ADMIN, Role.TEACHER]
        : [Role.STUDENT],
    }
  },
})

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

    const affiliations = OAuthProfile.swissEduIDLinkedAffiliationMail || []

    const email = affiliations.find((affiliation) =>
      allowedDomains.some((domain) => affiliation.endsWith(domain)),
    )

    if (!email) {
      throw new Error(
        `User does not have an appropriate affiliation for the allowed domains: ${allowedDomains.join(', ')}`,
      )
    }

    return {
      id: OAuthProfile.sub,
      name: OAuthProfile.name,
      email: email,
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

export const authOptions = {
  adapter: MyAdapter,
  providers: [keycloakProvider],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'database',
    maxAge: 24 * 60 * 60, // 24 hours
  },
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

      if (account.provider === 'keycloak' || account.provider === 'switch') {
        if (!user.email) {
          return false
        }

        await linkOrCreateUserForAccount(user, account)
        return true
      }

      return false
    },

    async jwt({ token, user, account }) {
      if (account && user) {
        token.id = user.id
        token.roles = user.roles
      }
      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
}

async function handleSingleSessionPerUser(user) {
  const activeSessions = await prisma.session.findMany({
    where: {
      userId: user.id,
    },
  })

  if (activeSessions.length > 0) {
    await prisma.session.deleteMany({
      where: {
        userId: user.id,
      },
    })
  }
}

async function linkOrCreateUserForAccount(user, account) {
  const existingUser = await prisma.user.findUnique({
    where: { email: user.email },
    include: { accounts: true },
  })

  if (!existingUser) {
    await prisma.user.create({
      data: {
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
    })
  } else if (
    !existingUser.accounts.some((acc) => acc.provider === account.provider)
  ) {
    await prisma.account.create({
      data: {
        userId: existingUser.id,
        type: account.type,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        refresh_token: account.refresh_token,
        access_token: account.access_token,
        expires_at: account.expires_at,
        token_type: account.token_type,
        scope: account.scope,
        id_token: account.id_token,
        session_state: account.session_state,
      },
    })
  }
}

export default NextAuth(authOptions)
