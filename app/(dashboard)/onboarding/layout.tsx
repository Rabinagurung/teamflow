import { orpc } from "@/lib/orpc/orpc"
import { getQueryClient, HydrateClient } from "@/lib/query/hydration"
import React from "react"

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const queryClient = getQueryClient()

  await queryClient.prefetchQuery(orpc.onboarding.state.queryOptions())
  return <HydrateClient client={queryClient}>{children}</HydrateClient>
}
