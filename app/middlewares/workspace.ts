import { base } from "./base"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/db"

type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>

export type AppWorkspace = {
  id: string
  name: string
  slug: string
  logo: string | null
  metadata: string | null
  createdAt: Date
  orgCode: string
  orgName: string
}

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

export const getWorkspaceForSession = async (
  session: NonNullable<AuthSession>,
) => {
  const activeOrganizationId = session.session.activeOrganizationId

  if (activeOrganizationId) {
    const activeWorkspace = await prisma.organization.findFirst({
      where: {
        id: activeOrganizationId,
        members: {
          some: {
            userId: session.user.id,
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

    if (activeWorkspace) {
      return toAppWorkspace(activeWorkspace)
    }
  }

  const membership = await prisma.member.findFirst({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "asc",
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

export const requiredWorkspaceMiddleware = base
  .$context<{
    workspace?: AppWorkspace
  }>()
  .middleware(async ({ context, next, errors }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      throw errors.UNAUTHORIZED()
    }

    const workspace =
      context.workspace ?? (await getWorkspaceForSession(session))

    if (!workspace) {
      return redirect("/no-workspace")
    }

    return next({
      context: { workspace },
    })
  })
