import { requireRouteAdminWorkspace } from "@/lib/workspace/admin-workspace.server"
import AdminPageShell from "../_components/AdminPageShell"
import { SubscriptionsTab } from "../_components/subscriptions-tab"

type AdminBillingPageProps = {
  params: Promise<{ workspaceId: string }>
}

const AdminBillingPage = async ({ params }: AdminBillingPageProps) => {
  const { workspaceId } = await params
  const access = await requireRouteAdminWorkspace(workspaceId)

  return (
    <AdminPageShell
      title="Billing"
      description="Review your current plan and see what unlocks when you upgrade."
      framed={false}
    >
      <SubscriptionsTab workspaceId={access.workspace.id} />
    </AdminPageShell>
  )
}

export default AdminBillingPage
