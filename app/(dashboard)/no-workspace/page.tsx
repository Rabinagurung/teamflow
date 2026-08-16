import "@/lib/orpc/orpc.server"
import React from "react"
import NoWorkspaceHero from "./_components/NoWorkspaceHero"
import { requireAuth } from "@/lib/auth/auth-utils"
import { orpc } from "@/lib/orpc/orpc"
import { redirect } from "next/navigation"
import { getQueryClient } from "@/lib/query/hydration"

const NoWorksapce = async () => {
  await requireAuth()
  const queryClient = getQueryClient()
  const { workspaces } = await queryClient.fetchQuery(
    orpc.workspace.list.queryOptions(),
  )

  if (workspaces.length > 0) {
    redirect("/get-started")
  }

  return <NoWorkspaceHero />
}

export default NoWorksapce
