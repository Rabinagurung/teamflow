"use client"

import { WorkspaceInviteMembersDialog } from "@/components/invitations/WorkspaceInviteMembersDialog"
import { Button } from "@/components/ui/button"
import { UserPlus2 } from "lucide-react"
import { useRouter } from "next/navigation"

const InvitePeopleButton = () => {
  const router = useRouter()

  return (
    <WorkspaceInviteMembersDialog
      onSuccess={() => {
        router.refresh()
      }}
      trigger={
        <Button
          type="button"
          className="h-11 rounded-2xl px-5 text-sm font-semibold shadow-sm"
        >
          <UserPlus2 className="size-4.5" />
          Invite People
        </Button>
      }
    />
  )
}

export default InvitePeopleButton
