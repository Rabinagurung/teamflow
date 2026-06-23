import "server-only"

import type { AppWorkspace } from "@/app/schemas/workspace"
import { auth } from "@/lib/auth/auth"
import prisma from "@/lib/db"
import { headers as nextHeaders } from "next/headers"

type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>

export type AdminWorkspaceRole = "owner" | "admin"

type AdminWorkspaceAccessErrorCode =
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

const getRequestHeaders = async (input?: HeadersInit) => {
  return input ? new Headers(input) : new Headers(await nextHeaders())
}

const syncActiveOrganization = async ({
  workspaceId,
  session,
  headers,
}: {
  workspaceId: string
  session: AuthSession
  headers: Headers
}) => {
  if (session.session.activeOrganizationId === workspaceId) {
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

export const requireAdminWorkspace = async ({
  workspaceId,
  session,
  headers: inputHeaders,
}: {
  workspaceId: string
  session: AuthSession
  headers?: HeadersInit
}) => {
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

  const headers = await getRequestHeaders(inputHeaders)
  await syncActiveOrganization({
    workspaceId,
    session,
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
    workspace: toAppWorkspace(membership.organization),
    memberRole: membership.role as AdminWorkspaceRole,
    workspaceHomeHref: defaultChannelId
      ? `/workspace/${workspaceId}/channel/${defaultChannelId}`
      : `/workspace/${workspaceId}`,
  }
}
