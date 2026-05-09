import "server-only"

import { auth } from "@/lib/auth/auth"
import prisma from "@/lib/db"
import type { AppWorkspace } from "@/app/schemas/workspace"

type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>

const toAppWorkspace = (workspace: {
  id: string
  name: string
  slug: string
  logo: string | null
  metadata: string | null
  createdAt: Date
}): AppWorkspace => ({
  ...workspace,
  orgCode: workspace.id,
  orgName: workspace.name,
})

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
    try {
      await auth.api.setActiveOrganization({
        body: {
          organizationId: fallbackWorkspace.id,
        },
        headers,
      })
    } catch (error) {
      console.error("Failed to heal active organization", error)
    }
  }

  return fallbackWorkspace
}
