"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRequiredActiveWorkspace } from "@/hooks/use-active-workspace"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { CreditCardIcon, PencilLine, Settings, Users } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import EditWorkspace from "./EditWorkspace"

const AdminTools = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [editWorkspaceOpen, setEditWorkspaceOpen] = useState(false)
  const { currentWorkspace, workspaceId, canManageWorkspace } =
    useRequiredActiveWorkspace()

  if (!canManageWorkspace) {
    return null
  }

  const membersHref = `/admin/${workspaceId}/members`
  const billingHref = `/admin/${workspaceId}/billing`
  const invitationsHref = `/admin/${workspaceId}/invitations`
  const accountSettingHref = `/admin/${workspaceId}/settings`

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <div className="flex flex-col items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label={`${currentWorkspace.name} admin tools`}
                  className="size-10 rounded-full border-workspace-rail-border bg-workspace-rail-accent text-white transition-all duration-200 hover:rounded-full hover:bg-sidebar-accent hover:text-white"
                >
                  <Settings className="size-6 text-white" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Admin</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <DropdownMenuContent
          align="end"
          side="right"
          sideOffset={8}
          className="w-[280px] rounded-2xl p-2"
        >
          <DropdownMenuLabel className="px-3 py-2 text-left text-base font-semibold">
            Admin Tools
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem
              asChild
              className="rounded-xl p-0 focus:bg-accent"
            >
              <Link
                target="_blank"
                rel="noopener noreferrer"
                href={billingHref}
                className="flex w-full items-start gap-3 px-3 py-3"
              >
                <div className="rounded-lg border bg-background p-2">
                  <CreditCardIcon className="size-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-none">
                    Manage billing
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Current plan and billing settings
                  </p>
                </div>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="rounded-xl p-0 focus:bg-accent"
              onSelect={() => {
                setMenuOpen(false)
                setEditWorkspaceOpen(true)
              }}
            >
              <div className="flex w-full items-start gap-3 px-3 py-2">
                <div className="rounded-lg border bg-background p-2">
                  <PencilLine className="size-4" />
                </div>

                <div className="min-w-0 flex flex-col items-start">
                  <p className="text-sm font-medium leading-none">
                    Edit workspace
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Edit workspace name
                  </p>
                </div>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              asChild
              className="rounded-xl p-0 focus:bg-accent"
            >
              <Link
                target="_blank"
                rel="noopener noreferrer"
                href={membersHref}
                className="flex w-full items-start gap-3 px-3 py-2"
              >
                <div className="rounded-lg border bg-background p-2">
                  <Users className="size-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-none">
                    Manage members
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Invite teammates and manage access
                  </p>
                </div>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="rounded-xl p-0 focus:bg-accent"
            >
              <Link
                target="_blank"
                rel="noopener noreferrer"
                href={invitationsHref}
                className="flex w-full items-start gap-3 px-3 py-2"
              >
                <div className="rounded-lg border bg-background p-2">
                  <Users className="size-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-none">
                    Invitations
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Invite teammates and manage access
                  </p>
                </div>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="rounded-xl p-0 focus:bg-accent"
            >
              <Link
                target="_blank"
                rel="noopener noreferrer"
                href={accountSettingHref}
                className="flex w-full items-start gap-3 px-3 py-2"
              >
                <div className="rounded-lg border bg-background p-2">
                  <Users className="size-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-none">
                    Account Settings
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Invite teammates and manage access
                  </p>
                </div>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditWorkspace
        open={editWorkspaceOpen}
        onOpenChange={setEditWorkspaceOpen}
      />
    </>
  )
}

export default AdminTools
