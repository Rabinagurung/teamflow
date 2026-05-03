"use client"

import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button"
import { authClient } from "@/lib/auth/auth-client"
import { useRouter } from "next/navigation"

interface InviteInformationProps {
  invitation: { id: string; organizationId: string }
}

export function InviteInformation({ invitation }: InviteInformationProps) {
  const router = useRouter()

  function acceptInvite() {
    return authClient.organization.acceptInvitation(
      {
        invitationId: invitation.id,
      },

      {
        onSuccess: async () => {
          await authClient.organization.setActive({
            organizationId: invitation.organizationId,
          })

          router.push(`/workspace/${invitation.organizationId}`)
        },
      },
    )
  }

  function rejectInvite() {
    return authClient.organization.rejectInvitation(
      {
        invitationId: invitation.id,
      },
      {
        onSuccess: () => router.push("/"),
      },
    )
  }

  return (
    <div className="flex gap-4">
      <BetterAuthActionButton className="grow" action={acceptInvite}>
        Accept
      </BetterAuthActionButton>
      <BetterAuthActionButton
        className="grow"
        variant="destructive"
        action={rejectInvite}
      >
        Reject
      </BetterAuthActionButton>
    </div>
  )
}
