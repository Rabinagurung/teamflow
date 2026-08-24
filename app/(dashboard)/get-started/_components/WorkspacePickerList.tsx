"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronsUpDown } from "lucide-react"
import { useState } from "react"
import WorkspacePickerItem from "./WorkspacePickerItem"

type WorkspacePickerListItem = {
  id: string
  name: string
  memberCount: number
}

export default function WorkspacePickerList({
  workspaces,
}: {
  workspaces: WorkspacePickerListItem[]
}) {
  const [pendingWorkspaceId, setPendingWorkspaceId] = useState<string | null>(
    null,
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5 text-left text-sm font-semibold text-foreground shadow-sm transition hover:bg-accent/40"
        >
          <span>
            {workspaces.length === 1
              ? workspaces[0].name
              : `Select a workspace (${workspaces.length})`}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-(--radix-dropdown-menu-trigger-width) p-1"
      >
        {workspaces.map((workspace) => (
          <WorkspacePickerItem
            key={workspace.id}
            id={workspace.id}
            name={workspace.name}
            memberCount={workspace.memberCount}
            disabled={pendingWorkspaceId !== null}
            isPending={pendingWorkspaceId === workspace.id}
            onPendingChange={setPendingWorkspaceId}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
