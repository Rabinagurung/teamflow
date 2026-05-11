import { getCurrentWorkspace } from "@/lib/workspace/current-workspace.server"
import { redirect } from "next/navigation"

export default async function WorkspacePage() {
  const workspace = await getCurrentWorkspace()

  if (workspace) {
    redirect(`/workspace/${workspace.id}`)
  }

  redirect("/app-entry")
}
