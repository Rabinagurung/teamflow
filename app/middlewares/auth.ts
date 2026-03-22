import { KindeUser } from "@kinde-oss/kinde-auth-nextjs"
import { base } from "./base"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

/**
 * Authentication middleware built on top of the shared base procedure configuration.
 *
 * This middleware ensures that a user is authenticated before a procedure
 * continues execution. It integrates with Kinde for session retrieval and
 * injects the authenticated user into the execution context.
 *
 * Notes:
 * - This is oRPC middleware, not Next.js middleware.
 * - It does not run automatically; procedures must explicitly apply it.
 * - Redirection behavior is handled using Next.js navigation utilities.
 */

/**
 * Authentication-required middleware.
 *
 * Context behavior:
 * - The initial context may include an optional `session` object
 *   with an optional `user`.
 * - If no session is present, the middleware fetches the user
 *   from the Kinde server session.
 *
 * Execution behavior:
 * - If no authenticated user is found, the request is redirected
 *   to the login route.
 * - If authentication succeeds, the `user` is injected into the
 *   execution context for downstream procedures.
 */
export const requiredAuthMiddleware = base
  .$context<{
    session?: { user?: KindeUser<Record<string, unknown>> }
  }>()
  .middleware(async ({ context, next }) => {
    const session =
      context.session ??
      (await auth.api.getSession({
        headers: await headers(),
      }))

    if (!session) {
      return redirect("/login")
    }

    return next({
      context: {
        user: session.user,
      },
    })
  })

/**
 * Retrieves the authenticated user from the Kinde server session.
 *
 * This function is used as a fallback when the incoming context
 * does not already contain a session.
 */
const getSession = async () => {
  const { getUser } = getKindeServerSession()
  const user = await getUser()

  return {
    user,
  }
}
