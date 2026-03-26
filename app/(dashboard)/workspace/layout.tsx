import React from "react"
import WorkspaceList from "./_components/WorkspaceList"
import CreateWorkspace from "./_components/CreateWorkspace"
import UserNav from "./_components/UserNav"
import { orpc } from "@/lib/orpc"
import { getQueryClient, HydrateClient } from "@/lib/query/hydration"
import { requireAuth } from "@/lib/auth-utils"

const WorkspaceLayout = async ({ children }: { children: React.ReactNode }) => {
  await requireAuth()

  const queryClient = getQueryClient()
  await queryClient.prefetchQuery(orpc.workspace.list.queryOptions())

  return (
    <div className="flex w-full h-screen">
      <aside
        className="flex h-full w-16 flex-col items-center bg-secondary py-3 px-2 border-r border-border"
        role="navigation"
        aria-label="Workspace navigation"
      >
        <HydrateClient client={queryClient}>
          <WorkspaceList />
        </HydrateClient>
        <div className="mt-4">
          <CreateWorkspace />
        </div>
        <div className="mt-auto">
          <HydrateClient client={queryClient}>
            <UserNav />
          </HydrateClient>
        </div>
      </aside>
      {children}
    </div>
  )
}

export default WorkspaceLayout
