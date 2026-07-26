"use client"

import { WorkspaceInviteMembersDialog } from "@/components/invitations/WorkspaceInviteMembersDialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { FolderPlus, Hash, Plus, UserPlus } from "lucide-react"
import CreateWorkspace from "./CreateWorkspace"
import CreateNewChannel from "../[workspaceId]/_components/CreateNewChannel"

const CreateNewAction = () => {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="size-10 rounded-full border-workspace-rail-border bg-workspace-rail-accent text-white transition-all duration-200 hover:rounded-full hover:bg-sidebar-accent hover:text-white"
            >
              <Plus className="size-6 text-white" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Create New</p>
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent
        align="end"
        side="right"
        sideOffset={8}
        className="w-[280px] rounded-2xl p-2"
      >
        <DropdownMenuLabel className="px-3 py-2 text-left text-base font-semibold">
          Create New
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <CreateNewChannel
            trigger={
              <div className="flex w-full cursor-pointer items-start gap-3 rounded-xl px-3 py-3 outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                <div className="rounded-lg border bg-background p-2">
                  <Hash className="size-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-none">
                    Add new channel
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Create a channel in this workspace
                  </p>
                </div>
              </div>
            }
          />

          <CreateWorkspace
            trigger={
              <div className="flex w-full cursor-pointer items-start gap-3 rounded-xl px-3 py-3 outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                <div className="rounded-lg border bg-background p-2">
                  <FolderPlus className="size-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-none">
                    Add new workspace
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Create another workspace
                  </p>
                </div>
              </div>
            }
          />

          <WorkspaceInviteMembersDialog
            trigger={
              <div className="flex w-full cursor-pointer items-start gap-3 rounded-xl px-3 py-3 outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                <div className="rounded-lg border bg-background p-2">
                  <UserPlus className="size-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-none">
                    Invite members
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Invite coworkers to this workspace
                  </p>
                </div>
              </div>
            }
          />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default CreateNewAction
