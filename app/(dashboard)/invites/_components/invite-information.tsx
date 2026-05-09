"use client"

import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button"
import { authClient } from "@/lib/auth/auth-client"
import { Check, X } from "lucide-react"
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
    <div className="flex flex-col gap-3 sm:flex-row">
      <BetterAuthActionButton
        className="h-12 flex-1 rounded-xl text-base"
        action={acceptInvite}
        successMessage="Invitation accepted"
      >
        <Check className="size-4" />
        Accept invitation
      </BetterAuthActionButton>
      <BetterAuthActionButton
        className="h-12 flex-1 rounded-xl border-destructive/30 text-base text-destructive hover:bg-destructive/10 hover:text-destructive"
        variant="outline"
        action={rejectInvite}
        successMessage="Invitation declined"
      >
        <X className="size-4" />
        Decline
      </BetterAuthActionButton>
    </div>
  )
}
