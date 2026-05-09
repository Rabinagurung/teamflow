"use client"

import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button"
import { authClient } from "@/lib/auth/auth-client"
import {
  SUPPORTED_OATUH_PROVIDER_DETAILS,
  SUPPORTED_OATUH_PROVIDERS,
} from "@/lib/auth/o-auth-providers"

import { toast } from "sonner"
export function SocialAuthButtons({
  callbackURL = "/app-entry",
}: {
  callbackURL?: string
}) {
  return SUPPORTED_OATUH_PROVIDERS.map((provider) => {
    const Icon = SUPPORTED_OATUH_PROVIDER_DETAILS[provider].Icon

    function handleClick() {
      return authClient.signIn.social({
        provider,
        callbackURL,
        errorCallbackURL: "/auth/login/error",
        fetchOptions: {
          onSuccess: (ctx) => {
            console.log("After user is created ", ctx.data)
          },
          onError: (ctx) => {
            toast.error(ctx.error.message)
          },
          // onSuccess: () => {
          //   router.push("/app-entry")
          // },
        },
      })
    }

    return (
      <BetterAuthActionButton
        variant="outline"
        key={provider}
        action={handleClick}
      >
        <Icon />
        {SUPPORTED_OATUH_PROVIDER_DETAILS[provider].name}
      </BetterAuthActionButton>
    )
  })
}
