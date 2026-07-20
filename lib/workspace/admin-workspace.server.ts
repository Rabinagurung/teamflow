import "server-only"

import type { AppWorkspace } from "@/app/schemas/workspace"
import { auth } from "@/lib/auth/auth"
import prisma from "@/lib/db"
import { headers as nextHeaders } from "next/headers"
import { cache } from "react"

type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>

export type AdminWorkspaceRole = "owner" | "admin"

export type AdminWorkspaceUser = {
  id: string
  name: string
  email: string
  image: string | null
}

export type AdminWorkspaceAccess = {
  workspace: AppWorkspace
  memberRole: AdminWorkspaceRole
  workspaceHomeHref: string
  user: AdminWorkspaceUser
}

type AdminWorkspaceAccessErrorCode =
  | "UNAUTHENTICATED"
  | "WORKSPACE_NOT_FOUND"
  | "WORKSPACE_MEMBER_REQUIRED"
  | "WORKSPACE_ADMIN_REQUIRED"

export class AdminWorkspaceAccessError extends Error {
  constructor(
    public readonly code: AdminWorkspaceAccessErrorCode,
    public readonly workspaceId: string,
  ) {
    super(code)
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

const toAdminWorkspaceUser = (
  user: AuthSession["user"],
): AdminWorkspaceUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  image: user.image ?? null,
})

const getRequestHeaders = async (input?: HeadersInit) => {
  return input ? new Headers(input) : new Headers(await nextHeaders())
}

const syncActiveOrganization = async ({
  workspaceId,
  activeOrganizationId,
  headers,
}: {
  workspaceId: string
  activeOrganizationId: string | null
  headers: Headers
}) => {
  if (activeOrganizationId === workspaceId) {
    return
  }

  try {
    await auth.api.setActiveOrganization({
      body: {
        organizationId: workspaceId,
      },
      headers,
    })
  } catch (error) {
    console.error("Failed to sync admin workspace active organization", error)
  }
}

const resolveAdminWorkspaceAccess = async ({
  workspaceId,
  session,
  headers,
}: {
  workspaceId: string
  session: AuthSession
  headers: Headers
}): Promise<AdminWorkspaceAccess> => {
  const membership = await prisma.member.findUnique({
    where: {
      organizationId_userId: {
        organizationId: workspaceId,
        userId: session.user.id,
      },
    },
    select: {
      role: true,
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

  if (!membership?.organization) {
    const workspaceExists = await prisma.organization.findUnique({
      where: {
        id: workspaceId,
      },
      select: {
        id: true,
      },
    })

    throw new AdminWorkspaceAccessError(
      workspaceExists ? "WORKSPACE_MEMBER_REQUIRED" : "WORKSPACE_NOT_FOUND",
      workspaceId,
    )
  }

  if (membership.role !== "owner" && membership.role !== "admin") {
    throw new AdminWorkspaceAccessError("WORKSPACE_ADMIN_REQUIRED", workspaceId)
  }

  await syncActiveOrganization({
    workspaceId,
    activeOrganizationId: session.session.activeOrganizationId ?? null,
    headers,
  })

  const [generalChannel, firstChannel] = await Promise.all([
    prisma.channel.findFirst({
      where: {
        organizationId: workspaceId,
        name: "general",
      },
      select: {
        id: true,
      },
    }),
    prisma.channel.findFirst({
      where: {
        organizationId: workspaceId,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
      },
    }),
  ])

  const defaultChannelId = generalChannel?.id ?? firstChannel?.id ?? null

  return {
    user: toAdminWorkspaceUser(session.user),
    workspace: toAppWorkspace(membership.organization),
    memberRole: membership.role as AdminWorkspaceRole,
    workspaceHomeHref: defaultChannelId
      ? `/workspace/${workspaceId}/channel/${defaultChannelId}`
      : `/workspace/${workspaceId}`,
  }
}
const requireAdminWorkspaceForRequest = cache(async (workspaceId: string) => {
  const headers = await getRequestHeaders()
  const session = await auth.api.getSession({ headers })

  if (!session?.user) {
    throw new AdminWorkspaceAccessError("UNAUTHENTICATED", workspaceId)
  }

  return resolveAdminWorkspaceAccess({
    workspaceId,
    session: session as AuthSession,
    headers,
  })
})

export const requireRouteAdminWorkspace = async (workspaceId: string) => {
  return requireAdminWorkspaceForRequest(workspaceId)
}

export const requireAdminWorkspace = async ({
  workspaceId,
  session,
  headers: inputHeaders,
}: {
  workspaceId: string
  session: AuthSession
  headers?: HeadersInit
}) => {
  const headers = await getRequestHeaders(inputHeaders)

  return resolveAdminWorkspaceAccess({
    workspaceId,
    session,
    headers,
  })
}
