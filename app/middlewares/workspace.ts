import { auth } from "@/lib/auth/auth"
import { resolveWorkspaceForSession } from "@/lib/workspace/current-workspace.server"
import { ArcjetNextRequest } from "@arcjet/next"
import { AppWorkspace } from "../schemas/workspace"
import { base } from "./base"

export const requiredWorkspaceMiddleware = base
  .$context<{
    request: Request | ArcjetNextRequest
    workspace?: AppWorkspace
  }>()
  .middleware(async ({ context, next, errors }) => {
    const headers = new Headers(context.request.headers as HeadersInit)

    const session = await auth.api.getSession({ headers })

    if (!session) {
      throw errors.UNAUTHORIZED()
    }

    const workspace =
      context.workspace ??
      (await resolveWorkspaceForSession({ session, headers }))

    if (!workspace) {
      throw errors.FORBIDDEN({
        message: "NO_WORKSPACE",
      })
    }

    return next({
      context: { ...context, workspace },
    })
  })
