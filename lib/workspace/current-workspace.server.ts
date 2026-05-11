import "server-only"

import { auth } from "@/lib/auth/auth"
import prisma from "@/lib/db"

import type { AppWorkspace } from "@/app/schemas/workspace"
import { headers as nextHeaders } from "next/headers"

type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>

export class NoWorkspaceError extends Error {
  code = "NO_WORKSPACE" as const

  constructor() {
    super("NO_WORKSPACE")
  }
}
const toAppWorkspace = (workspace: {
  id: string
  name: string
  slug: string
  logo: string | null
  metadata: string | null
  createdAt: Date
}): AppWorkspace => ({
  id: workspace.id,
  name: workspace.name,
  slug: workspace.slug,
  logo: workspace.logo,
  metadata: workspace.metadata,
  createdAt: workspace.createdAt,
})

const getRequestHeaders = async (input?: HeadersInit) => {
  return input ? new Headers(input) : new Headers(await nextHeaders())
}

const findWorkspaceByIdForUser = async ({
  organizationId,
  userId,
}: {
  organizationId: string
  userId: string
}) => {
  const organization = await prisma.organization.findFirst({
    where: {
      id: organizationId,
      members: {
        some: {
          userId,
        },
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      metadata: true,
      createdAt: true,
    },
  })

  return organization ? toAppWorkspace(organization) : null
}

const findFallbackWorkspaceForUser = async (userId: string) => {
  const membership = await prisma.member.findFirst({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          metadata: true,
          createdAt: true,
        },
      },
    },
  })

  return membership?.organization
    ? toAppWorkspace(membership.organization)
    : null
}

const trySetActiveOrganization = async ({
  organizationId,
  headers,
}: {
  organizationId: string
  headers: Headers
}) => {
  try {
    await auth.api.setActiveOrganization({
      body: {
        organizationId,
      },
      headers,
    })
  } catch (error) {
    console.error("Failed to heal active organization", error)
  }
}

export const resolveWorkspaceForSession = async ({
  session,
  headers,
}: {
  session: AuthSession
  headers: Headers
}) => {
  const activeOrganizationId = session.session.activeOrganizationId

  if (activeOrganizationId) {
    const activeWorkspace = await findWorkspaceByIdForUser({
      organizationId: activeOrganizationId,
      userId: session.user.id,
    })

    if (activeWorkspace) {
      return activeWorkspace
    }
  }

  const fallbackWorkspace = await findFallbackWorkspaceForUser(session.user.id)

  if (!fallbackWorkspace) {
    return null
  }

  if (fallbackWorkspace.id !== activeOrganizationId) {
    await trySetActiveOrganization({
      organizationId: fallbackWorkspace.id,
      headers,
    })
  }

  return fallbackWorkspace
}

export const getCurrentWorkspace = async (input?: {
  headers?: HeadersInit
}) => {
  const headers = await getRequestHeaders(input?.headers)
  const session = await auth.api.getSession({ headers })

  if (!session) {
    return null
  }

  return resolveWorkspaceForSession({
    session: session as AuthSession,
    headers,
  })
}

export const requireCurrentWorkspace = async (input?: {
  headers?: HeadersInit
}) => {
  const workspace = await getCurrentWorkspace(input)

  if (!workspace) {
    throw new NoWorkspaceError()
  }

  return workspace
}
