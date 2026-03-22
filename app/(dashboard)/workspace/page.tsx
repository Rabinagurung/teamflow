import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getWorkspaceForSession } from "@/app/middlewares/workspace"

const WorkspacePage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  const currentWorkspace = await getWorkspaceForSession(session)

  if (!currentWorkspace) {
    redirect("/no-workspace")
  }

  redirect(`/workspace/${currentWorkspace.orgCode}`)
}

export default WorkspacePage
