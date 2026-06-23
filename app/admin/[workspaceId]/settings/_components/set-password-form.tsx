"use client"

import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button"
import { authClient } from "@/lib/auth/auth-client"
import { Mail } from "lucide-react"

export function SetPasswordButton({ email }: { email: string }) {
  return (
    <BetterAuthActionButton
      className="h-11 w-full rounded-xl px-4 font-semibold shadow-sm"
      successMessage="Password reset email sent"
      action={() =>
        authClient.requestPasswordReset({
          email,
          redirectTo: "/reset-password",
        })
      }
    >
      <Mail />
      Send Password Reset Email
    </BetterAuthActionButton>
  )
}
