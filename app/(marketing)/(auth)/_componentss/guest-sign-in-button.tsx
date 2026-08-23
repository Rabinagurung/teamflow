"use client"

import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button"
import { authClient } from "@/lib/auth/auth-client"
import { useRouter } from "next/navigation"
import { ComponentProps } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utlis/utils"

export function GuestSignInButton({
  callbackURL = "/app-entry",
  variant = "outline",
  className,
  children = "Continue as guest",
  ...props
}: Omit<ComponentProps<typeof Button>, "onClick" | "asChild"> & {
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
      {...props}
      variant={variant}
      className={cn("w-full", className)}
      action={signInAsGuest}
    >
      {children}
    </BetterAuthActionButton>
  )
}
