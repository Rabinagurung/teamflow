import { requireAuth } from "@/lib/auth/auth-utils"
import { orpc } from "@/lib/orpc/orpc"
import { getQueryClient, HydrateClient } from "@/lib/query/hydration"
import { redirect } from "next/navigation"
import React from "react"

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuth()

  const queryClient = getQueryClient()

  // const { workspaces } = await queryClient.fetchQuery(
  //   orpc.workspace.list.queryOptions(),
  // )

  // if (workspaces.length > 0) {
  //   redirect("/get-started")
  // }

  await queryClient.prefetchQuery(orpc.onboarding.state.queryOptions())
  return <HydrateClient client={queryClient}>{children}</HydrateClient>
}
