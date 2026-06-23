import prisma from "@/lib/db"
import AdminPageShell from "../_components/AdminPageShell"
import AdminMembersTable from "../_components/AdminMembersTable"
import InvitePeopleButton from "../_components/InvitePeopleButton"

type AdminMembersPageProps = {
  params: Promise<{ workspaceId: string }>
}

const AdminMembersPage = async ({ params }: AdminMembersPageProps) => {
  const { workspaceId } = await params

  const members = await prisma.member.findMany({
    where: {
      organizationId: workspaceId,
    },
    orderBy: [
      {
        createdAt: "asc",
      },
    ],
    select: {
      id: true,
      role: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  })

  return (
    <AdminPageShell
      title="Manage members"
      description="Review everyone in this workspace and quickly search by name or email."
      actions={<InvitePeopleButton />}
      framed={false}
    >
      <AdminMembersTable members={members} />
    </AdminPageShell>
  )
}

export default AdminMembersPage
