import React from "react"
import RegisterForm from "../_componentss/register-form"
import { requireUnauth } from "@/lib/auth/auth-utils"
import { SocialAuthButtons } from "../_componentss/social-auth-buttons"

const SignUp = async () => {
  await requireUnauth()

  return (
    <div>
      <RegisterForm />
      <div className="grid grid-cols-2 gap-3">
        <SocialAuthButtons />
      </div>
    </div>
  )
}

export default SignUp
