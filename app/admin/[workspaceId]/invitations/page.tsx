import prisma from "@/lib/db"
import AdminInvitationsTabs from "../_components/AdminInvitationsTabs"
import AdminPageShell from "../_components/AdminPageShell"
import InvitePeopleButton from "../_components/InvitePeopleButton"

type AdminInvitationsPageProps = {
  params: Promise<{ workspaceId: string }>
}

const AdminInvitationsPage = async ({ params }: AdminInvitationsPageProps) => {
  const { workspaceId } = await params

  const invitations = await prisma.invitation.findMany({
    where: {
      organizationId: workspaceId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      expiresAt: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  })

  return (
    <AdminPageShell
      title="Invitations"
      description="Invite others to join your workspace and keep a close eye on pending and accepted access."
      actions={<InvitePeopleButton />}
      framed={false}
    >
      <AdminInvitationsTabs invitations={invitations} />
    </AdminPageShell>
  )
}

export default AdminInvitationsPage
