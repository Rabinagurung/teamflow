import React from "react"
import RegisterForm from "../../_components/register-form"
import { requireUnauth } from "@/lib/auth-utils"

const SignUp = async () => {
  await requireUnauth()

  return (
    <div>
      <RegisterForm />
    </div>
  )
}

export default SignUp
