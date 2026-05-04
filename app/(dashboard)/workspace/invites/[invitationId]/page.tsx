// Backward-compatible invite URL.
// Older emails may still link to /workspace/invites/{invitationId};
// redirect them to the canonical /invites/{invitationId} route.
import { redirect } from "next/navigation"
export default async function InvitationPage({
  params,
}: PageProps<"/workspace/invites/[invitationId]">) {
  const { invitationId } = await params

  redirect(`/invites/${invitationId}`)
}
