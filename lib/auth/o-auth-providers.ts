import { GoogleIcon, GitHubIcon } from "@/components/auth/o-auth-icons"

import { ComponentProps, ElementType } from "react"

//available o-auth providers
export const SUPPORTED_OATUH_PROVIDERS = ["google", "github"] as const
export type SupportedOAuthProvider = (typeof SUPPORTED_OATUH_PROVIDERS)[number]

export const SUPPORTED_OATUH_PROVIDER_DETAILS: Record<
  SupportedOAuthProvider,
  { name: string; Icon: ElementType<ComponentProps<"svg">> }
> = {
  google: { name: "Google", Icon: GoogleIcon },
  github: { name: "Github", Icon: GitHubIcon },
}
