import {
  AdminWorkspaceAccessError,
  requireRouteAdminWorkspace,
} from "@/lib/workspace/admin-workspace.server"
import { redirect } from "next/navigation"
import React from "react"
import AdminSidebar from "./_components/AdminSidebar"

const AdminWorkspaceLayout = async ({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ workspaceId: string }>
}) => {
  const { workspaceId } = await params

  let access
  try {
    access = await requireRouteAdminWorkspace(workspaceId)
  } catch (error) {
    if (error instanceof AdminWorkspaceAccessError) {
      if (error.code === "UNAUTHENTICATED") {
        redirect("/login")
      }

      if (error.code === "WORKSPACE_ADMIN_REQUIRED") {
        redirect(`/workspace/${workspaceId}`)
      }

      redirect("/app-entry")
    }

    throw error
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/20 text-foreground">
      <AdminSidebar
        workspace={access.workspace}
        workspaceHomeHref={access.workspaceHomeHref}
        adminUser={access.user}
      />
      <div className="flex min-w-0 flex-1 flex-col bg-background/80">
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8 md:py-8 lg:px-10 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminWorkspaceLayout
