import { TeamFlowInvitationCard } from "@/components/invites/TeamFlowInvitationCard"
import { InviteInformation } from "../_components/invite-information"
import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { headers } from "next/headers"

export default async function InvitationPage({
  params,
}: PageProps<"/invites/[invitationId]">) {
  const { invitationId } = await params

  if (!invitationId) redirect("/")
  const session = await auth.api.getSession({ headers: await headers() })
  const inviteURL = invitationId
    ? `/login?inviteURL=${encodeURIComponent(invitationId)}`
    : "/login"

  if (session == null) return redirect(inviteURL)

  const invitation = await auth.api
    .getInvitation({
      headers: await headers(),
      query: { id: invitationId },
    })
    .catch(() => redirect("/"))

  return (
    <TeamFlowInvitationCard
      organizationName={invitation.organizationName}
      role={invitation.role}
    >
      <InviteInformation invitation={invitation} />
    </TeamFlowInvitationCard>
  )
}
