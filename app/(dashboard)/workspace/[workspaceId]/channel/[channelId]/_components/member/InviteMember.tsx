"use client"

import { WorkspaceInviteMembersDialog } from "@/components/invitations/WorkspaceInviteMembersDialog"
import { Button } from "@/components/ui/button"

import { UserPlus } from "lucide-react"

const InviteMember = () => {
  return (
    <WorkspaceInviteMembersDialog
      trigger={
        <Button variant="outline" className="dark:hover:text-white">
          <UserPlus />
          Invite Member
        </Button>
      }
    />
  )
}

export default InviteMember
