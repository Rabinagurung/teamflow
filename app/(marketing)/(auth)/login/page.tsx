import React from "react"
import LoginForm from "@/app/(marketing)/(auth)/_componentss/login-form"
import { requireUnauth } from "@/lib/auth/auth-utils"
import { SocialAuthButtons } from "../_componentss/social-auth-buttons"

const Page = async () => {
  await requireUnauth()
  return (
    <div>
      <LoginForm />
      <div className="grid grid-cols-2 gap-3">
        <SocialAuthButtons />
      </div>
    </div>
  )
}

export default Page
