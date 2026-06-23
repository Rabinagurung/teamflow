import React from "react"
import Image from "next/image"
import Link from "next/link"
import WorkspaceList from "./_components/WorkspaceList"
import CreateWorkspace from "./_components/CreateWorkspace"
import UserNav from "./_components/UserNav"
import { orpc } from "@/lib/orpc/orpc"
import { getQueryClient, HydrateClient } from "@/lib/query/hydration"
import { requireAuth } from "@/lib/auth/auth-utils"
import AdminTools from "./_components/AdminTools"

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
          <Link
            href="/app-entry"
            className="mb-4 flex size-10 items-center justify-center rounded-lg border border-workspace-rail-border bg-workspace-rail-accent shadow-xs transition-colors hover:bg-sidebar-accent"
            aria-label="TeamFlow home"
          >
            <Image
              src="/logos/teamflow-mark.svg"
              alt=""
              width={28}
              height={28}
              priority
            />
          </Link>

          <WorkspaceList />

          <div className="mt-4">
            <CreateWorkspace />
          </div>
          <div className="mt-auto">
            <AdminTools />
            <UserNav />
          </div>
        </aside>
        {children}
      </div>
    </HydrateClient>
  )
}

export default WorkspaceLayout
