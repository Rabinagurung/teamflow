import React from "react"
import LoginForm from "@/app/(marketing)/(auth)/_componentss/login-form"
import { requireUnauth } from "@/lib/auth/auth-utils"
import { getInviteRedirectPath } from "@/lib/invites/invite-redirect"

const Page = async ({ searchParams }: PageProps<"/login">) => {
  const { inviteURL } = await searchParams
  const inviteRedirectPath = getInviteRedirectPath(
    Array.isArray(inviteURL) ? inviteURL[0] : inviteURL,
  )

  await requireUnauth(inviteRedirectPath ?? "/app-entry")
  return <LoginForm />
}

export default Page
