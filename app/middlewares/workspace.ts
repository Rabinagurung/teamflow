import { auth } from "@/lib/auth/auth"
import { resolveWorkspaceForSession } from "@/lib/workspace/current-workspace.server"
import { ArcjetNextRequest } from "@arcjet/next"
import { AppWorkspace } from "../schemas/workspace"
import { base } from "./base"

/**
 * Middleware that guarantees every downstream workspace-protected procedure
 * has a valid `context.workspace`.
 *
 * Motive:
 * -------
 * This middleware is the single source of truth for resolving the current
 * workspace for an authenticated user.
 *
 * Workspace routes should not directly trust `session.activeOrganizationId`
 * because it may be missing, stale, or point to an organization the user no
 * longer belongs to.
 *
 * Instead of repeating workspace/session checks in every router, this middleware:
 *
 * 1. Reads the current auth session from the request headers.
 * 2. Verifies that the user is authenticated.
 * 3. Checks the session's `activeOrganizationId`.
 * 4. Confirms the user is still a member of that organization.
 * 5. Falls back to the user's latest workspace membership if needed.
 * 6. Heals the session by calling `setActiveOrganization` when fallback is used.
 * 7. Converts the organization record into an `AppWorkspace`.
 * 8. Adds the resolved workspace to ORPC context.
 *
 * Why this exists:
 * ----------------
 * A user may:
 *
 * - Have no active organization selected.
 * - Have an outdated `activeOrganizationId`.
 * - Have been removed from a workspace.
 * - Join a new workspace.
 * - Switch between organizations.
 *
 * This middleware protects workspace routes from those edge cases by validating
 * workspace access against the database before continuing the request.
 *
 * Expected context before this middleware:
 * ----------------------------------------
 *
 * ```ts
 * {
 *   request: Request | ArcjetNextRequest
 *   workspace?: AppWorkspace
 * }
 * ```
 *
 * `workspace` is optional because some upstream middleware or route context may
 * already provide it. If it exists, this middleware reuses it.
 *
 * Expected context after this middleware:
 * ---------------------------------------
 *
 * ```ts
 * {
 *   ...context,
 *   workspace: AppWorkspace
 * }
 * ```
 *
 * After this middleware succeeds, downstream handlers can safely assume:
 *
 * ```ts
 * context.workspace
 * ```
 *
 * exists and belongs to the authenticated user.
 *
 * Error behavior:
 * ---------------
 *
 * Throws `UNAUTHORIZED` when no valid session exists.
 *
 * Throws `FORBIDDEN` with message `"NO_WORKSPACE"` when the user is authenticated
 * but does not belong to any valid workspace.
 *
 *  * Architectural role:
 * -------------------
 *
 * ```txt
 * base middleware
 *   → provides request context
 *
 * auth/session middleware
 *   → validates user session
 *
 * requiredWorkspaceMiddleware
 *   → resolves and validates current workspace
 *
 * route handlers
 *   → consume context.workspace and focus on business logic
 * ```
 *
 * Recommended usage:
 * ------------------
 *
 * Use this middleware on any route that requires a workspace.
 *
 */
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
