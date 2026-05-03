import { auth } from "@/lib/auth/auth"
import prisma from "@/lib/db"
import { ArcjetNextRequest } from "@arcjet/next"
import { AppWorkspace } from "../schemas/workspace"
import { base } from "./base"

type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>

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

export const requiredWorkspaceMiddleware = base
  .$context<{
    request: Request | ArcjetNextRequest
    workspace?: AppWorkspace
  }>()
  .middleware(async ({ context, next, errors }) => {
    const session = await auth.api.getSession({
      headers: new Headers(context.request.headers as HeadersInit),
    })

    if (!session) {
      throw errors.UNAUTHORIZED()
    }

    const workspace =
      context.workspace ?? (await getWorkspaceForSession(session))

    // if (!workspace) {
    //   return redirect("/no-workspace")
    // }

    if (!workspace) {
      throw errors.FORBIDDEN({
        message: "NO_WORKSPACE",
      })
    }

    // console.log("Active workspace by workspacemiddleware: ", workspace?.name)

    return next({
      context: { workspace },
    })
  })
