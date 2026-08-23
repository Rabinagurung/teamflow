"use client"

import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button"
import { authClient } from "@/lib/auth/auth-client"
import { useRouter } from "next/navigation"

export function GuestSignInButton({
  callbackURL = "/app-entry",
}: {
  callbackURL?: string
}) {
  const router = useRouter()

  async function signInAsGuest() {
    const res = await authClient.signIn.anonymous()

    if (!res.error) {
      router.push(callbackURL)
    }

    return res
  }

  return (
    <BetterAuthActionButton
      variant="outline"
      className="w-full"
      action={signInAsGuest}
    >
      Continue as guest recruiter
    </BetterAuthActionButton>
  )
}
