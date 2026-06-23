import { getCurrentWorkspace } from "@/lib/workspace/current-workspace.server"
import { redirect } from "next/navigation"

const AdminPage = async () => {
  const workspace = await getCurrentWorkspace()

  if (!workspace) {
    redirect("/app-entry")
  }

  redirect(`/admin/${workspace.id}`)
}

export default AdminPage
