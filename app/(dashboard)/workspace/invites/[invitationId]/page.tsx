import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { auth } from "@/lib/auth/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { InviteInformation } from "../_components/invite-information"

export default async function InvitationPage({
  params,
}: PageProps<"/workspace/invites/[invitationId]">) {
  const { invitationId } = await params

  const session = await auth.api.getSession({ headers: await headers() })
  // const inviteURL = invitationId
  //   ? `/auth/login?inviteURL=${invitationId}`
  //   : "/auth/login"

  // if (session == null) return redirect(inviteURL)
  const inviteLoginUrl = invitationId
    ? `/login?callbackURL=${encodeURIComponent(`/workspace/invites/${invitationId}`)}`
    : "/login"

  if (session == null) return redirect(inviteLoginUrl)
  console.log("Inivte page invitationId: ", invitationId)

  const invitation = await auth.api
    .getInvitation({
      headers: await headers(),
      query: { id: invitationId },
    })
    .catch(() => redirect("/"))

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Organization Invitation</CardTitle>
          <CardDescription>
            You have been invited to join the {invitation.organizationName}
            organization as a {invitation.role}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteInformation invitation={invitation} />
        </CardContent>
        x
      </Card>
    </div>
  )
}
