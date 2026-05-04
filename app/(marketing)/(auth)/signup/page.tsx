import React from "react"
import RegisterForm from "../_componentss/register-form"
import { requireUnauth } from "@/lib/auth/auth-utils"
import { getInviteRedirectPath } from "@/lib/invites/invite-redirect"

const SignUp = async ({ searchParams }: PageProps<"/signup">) => {
  const { inviteURL } = await searchParams
  const inviteRedirectPath = getInviteRedirectPath(
    Array.isArray(inviteURL) ? inviteURL[0] : inviteURL,
  )

  await requireUnauth(inviteRedirectPath ?? "/app-entry")

  return (
    <div>
      <RegisterForm />
    </div>
  )
}

export default SignUp
