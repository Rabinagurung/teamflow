import "@/lib/orpc/orpc.server"
import { requireAuth } from "@/lib/auth/auth-utils"

import { getQueryClient } from "@/lib/query/hydration"
import { redirect } from "next/navigation"
import Image from "next/image"
import CreateWorkspaceCard from "./_components/CreateWorkspaceCard"
import WorkspacePickerList from "./_components/WorkspacePickerList"
import { orpc } from "@/lib/orpc/orpc"

export default async function GetStartedPage() {
  await requireAuth()

  const queryClient = getQueryClient()

  const { workspaces } = await queryClient.fetchQuery(
    orpc.workspace.list.queryOptions(),
  )

  if (workspaces.length === 0) redirect("/no-workspace")

  return (
    <main className="h-screen overflow-hidden bg-background text-foreground md:p-4 sm:p-5">
      <div className="h-full overflow-hidden border border-border bg-secondary/60 shadow-2xl shadow-primary/10 md:rounded-2xl">
        <section className="flex h-full w-full justify-center overflow-hidden bg-secondary/60 px-4 py-6 sm:px-10 lg:px-16">
          <div className="flex h-full w-full max-w-3xl flex-col">
            <div className="mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <Image
                  src="/logos/teamflow-mark.svg"
                  alt=""
                  width={24}
                  height={24}
                  priority
                  className="size-6"
                />

                <p className="text-lg font-semibold text-primary">TeamFlow</p>
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                Welcome back
              </h1>
              <p className="mt-4 max-w-xl text-lg leading-8 text-muted-foreground">
                Choose a workspace to get back to work with your team.
              </p>
            </div>

            <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-border bg-card p-5 shadow-xl shadow-primary/5">
              <div className="mb-5 flex shrink-0 items-center justify-between gap-4">
                <p className="text-lg font-semibold">Ready to launch</p>
                <div className="hidden rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground sm:block">
                  {workspaces.length} workspace
                  {workspaces.length === 1 ? "" : "s"}
                </div>
              </div>

              <WorkspacePickerList
                workspaces={workspaces.map((workspace) => ({
                  id: workspace.id,
                  name: workspace.name,
                  memberCount: 0,
                }))}
              />

              <div className="my-6 flex shrink-0 items-center gap-4 text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                  Or
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="shrink-0 space-y-3">
                <p className="text-lg font-semibold">Create a new workspace</p>
                <CreateWorkspaceCard />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

// Since I already have workspaces, I will get redirected to /get-started route and I have WorkspacePickerList.tsx and CreateWorkspaceCard.tsx rendered
