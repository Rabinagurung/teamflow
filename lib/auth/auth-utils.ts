import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "./auth"

//These are for good user experience,
// Actual security layer is handled by DATA ACCESS LAYER(orpc) -> oprc auth middleware)
export const requireAuth = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  return session
}

/** User tries to visit login page while still being authenticated -> redirected to workspace route.*/
export const requireUnauth = async (redirectTo = "/app-entry") => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session) {
    redirect(redirectTo)
  }
}
