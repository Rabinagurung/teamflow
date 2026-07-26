"use client"

import { WorkspaceInviteMembersDialog } from "@/components/invitations/WorkspaceInviteMembersDialog"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { UserPlus } from "lucide-react"

const InviteMembersAction = () => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div>
          <WorkspaceInviteMembersDialog
            trigger={
              <Button
                size="icon"
                variant="outline"
                className="size-10 rounded-full border-workspace-rail-border bg-workspace-rail-accent text-white transition-all duration-200 hover:rounded-full hover:bg-sidebar-accent hover:text-white"
              >
                <UserPlus className="size-5 text-white" />
              </Button>
            }
          />
        </div>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>Invite Members</p>
      </TooltipContent>
    </Tooltip>
  )
}

export default InviteMembersAction
