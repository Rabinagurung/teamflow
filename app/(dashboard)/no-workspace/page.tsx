import React from "react"
import NoWorkspaceHero from "./_components/NoWorkspaceHero"
import { requireAuth } from "@/lib/auth/auth-utils"
import { client } from "@/lib/orpc/orpc"
import { redirect } from "next/navigation"

const NoWorksapce = async () => {
  await requireAuth()

  const { workspaces } = await client.workspace.list()
  if (workspaces.length > 0) {
    redirect("/get-started")
  }
  return <NoWorkspaceHero />
}

export default NoWorksapce
