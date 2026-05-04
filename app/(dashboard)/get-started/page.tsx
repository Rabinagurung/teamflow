import { requireAuth } from "@/lib/auth/auth-utils"
import { client } from "@/lib/orpc/orpc"

import { redirect } from "next/navigation"
import Image from "next/image"
import CreateWorkspaceCard from "./_components/CreateWorkspaceCard"
import WorkspacePickerList from "./_components/WorkspacePickerList"

export default async function GetStartedPage() {
  await requireAuth()

  const { workspaces, user } = await client.workspace.list()

  //   const workspaceListQuery = orpc.workspace.list.queryOptions()

  //   const {
  //     data: { workspaces, user },
  //   } = useSuspenseQuery(workspaceListQuery)

  if (workspaces.length === 0) redirect("/no-workspace")

  return (
    <main className="min-h-screen bg-background p-4 text-foreground sm:p-5">
      <div className="grid min-h-[calc(100vh-32px)] overflow-hidden rounded-2xl border border-border bg-secondary/60 shadow-2xl shadow-primary/10 sm:min-h-[calc(100vh-40px)] lg:grid-cols-[300px_1fr]">
        <aside className="border-b border-workspace-rail-border bg-workspace-rail p-6 text-sidebar-foreground lg:border-r lg:border-b-0 lg:p-8">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-primary shadow-inner shadow-white/10">
              <Image
                src="/logos/teamflow-mark.svg"
                alt=""
                width={24}
                height={24}
                priority
                className="size-6"
              />
            </div>
            <p className="text-lg font-semibold text-sidebar-foreground">
              TeamFlow
            </p>
          </div>

          <div className="mt-12 space-y-3 border-t border-white/10 pt-7 text-sm font-medium text-sidebar-foreground/70">
            <p className="rounded-lg bg-white/10 px-3 py-2 text-sidebar-foreground">
              Workspaces
            </p>
            <p className="px-3 py-2">Channels</p>
            <p className="px-3 py-2">Direct messages</p>
          </div>
        </aside>

        <section className="flex w-full items-start bg-secondary/60 px-6 py-10 sm:px-10 lg:px-16">
          <div className="w-full max-w-3xl">
            <div className="mb-10">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                TeamFlow
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                Welcome back
              </h1>
              <p className="mt-4 max-w-xl text-lg leading-8 text-muted-foreground">
                Choose a workspace to get back to work with your team.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-xl shadow-primary/5">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold">Ready to launch</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {user.email}
                  </p>
                </div>
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

              <div className="my-8 flex items-center gap-4 text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                  Or
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="space-y-3">
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
