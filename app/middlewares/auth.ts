import { auth } from "@/lib/auth/auth"
import { ArcjetNextRequest } from "@arcjet/next"
import { redirect } from "next/navigation"
import { base } from "./base"

type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>
type AuthUser = NonNullable<AuthSession>["user"]

export type AppUser = Omit<
  AuthUser,
  "image" | "family_name" | "given_name" | "picture"
> & {
  image: string | null
  family_name: string | null
  given_name: string | null
  picture: string | null
}

const toAppUser = (user: AuthUser): AppUser => ({
  ...user,
  image: user.image ?? null,
  family_name: user.family_name ?? null,
  given_name: user.given_name ?? null,
  picture:
    (user as AuthUser & { picture?: string }).picture ?? user.image ?? null,
})

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
    request: Request | ArcjetNextRequest
    session?: AuthSession
  }>()
  .middleware(async ({ context, next }) => {
    const session =
      context.session ??
      (await auth.api.getSession({
        headers: new Headers(context.request.headers as HeadersInit),
      }))

    if (!session?.user) {
      return redirect("/login")
    }

    return next({
      context: {
        user: toAppUser(session.user),
      },
    })
  })
