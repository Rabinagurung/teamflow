import { requireAuth } from "@/lib/auth/auth-utils"
import { client } from "@/lib/orpc/orpc"
import Link from "next/link"
import { redirect } from "next/navigation"
import CreateWorkspaceCard from "./_components/CreateWorkspaceCard"
import WorkspacePickerList from "./_components/WorkspacePickerList"

export default async function GetStartedPage() {
  const session = await requireAuth()

  const { workspaces, user } = await client.workspace.list()

  //   const workspaceListQuery = orpc.workspace.list.queryOptions()

  //   const {
  //     data: { workspaces, user },
  //   } = useSuspenseQuery(workspaceListQuery)

  if (workspaces.length === 0) redirect("/no-workspace")

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-10">
        <header className="flex items-start justify-between">
          <p className="text-sm font-semibold tracking-[0.18em] text-muted-foreground">
            TEAMFLOW
          </p>
          <Link
            href="/login"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            Sign in to another account
          </Link>
        </header>

        <section className="mx-auto mt-10 w-full max-w-3xl">
          <div className="text-center">
            <h1 className="text-5xl font-semibold tracking-tight">
              Welcome back!
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Choose a workspace to get back to work with your team.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            <div>
              <p className="text-xl font-semibold">Ready to launch</p>
              <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
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
              <span className="text-sm font-medium">OR</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="space-y-4">
              <p className="text-3xl font-semibold">Create a new workspace</p>
              <CreateWorkspaceCard />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
