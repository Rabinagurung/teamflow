import "@/lib/orpc/orpc.server"
import { requireAuth } from "@/lib/auth/auth-utils"
import { orpc } from "@/lib/orpc/orpc"
import { getQueryClient, HydrateClient } from "@/lib/query/hydration"
import React from "react"
import AdminTools from "./_components/AdminTools"
import CreateNewAction from "./_components/CreateNewAction"
import CreateWorkspace from "./_components/CreateWorkspace"
import InviteMembersAction from "./_components/InviteMembersAction"
import UserNav from "./_components/UserNav"
import WorkspaceList from "./_components/WorkspaceList"

const WorkspaceLayout = async ({ children }: { children: React.ReactNode }) => {
  await requireAuth()

  const queryClient = getQueryClient()
  await queryClient.prefetchQuery(orpc.workspace.list.queryOptions())

  return (
    <HydrateClient client={queryClient}>
      <div className="flex h-screen w-full">
        <aside
          className="flex h-full w-16 flex-col items-center border-r border-workspace-rail-border bg-workspace-rail px-2 py-3"
          role="navigation"
          aria-label="Workspace navigation"
        >
          <WorkspaceList />

          <div className="mt-4">
            <CreateWorkspace />
          </div>
          <div className="mt-auto flex flex-col items-center">
            <div className="flex flex-col items-center gap-3">
              <AdminTools />
              <InviteMembersAction />
              <CreateNewAction />
            </div>

            <div className="mt-3">
              <UserNav />
            </div>
          </div>
        </aside>
        {children}
      </div>
    </HydrateClient>
  )
}

export default WorkspaceLayout
