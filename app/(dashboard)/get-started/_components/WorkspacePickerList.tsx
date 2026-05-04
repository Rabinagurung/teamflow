"use client"

import { Card, CardContent } from "@/components/ui/card"
import { WorkspaceItem } from "@/lib/app-entry"
import { useState } from "react"
import WorkspacePickerItem from "./WorkspacePickerItem"

export default function WorkspacePickerList({
  workspaces,
}: {
  workspaces: WorkspaceItem[]
}) {
  const [pendingWorkspaceId, setPendingWorkspaceId] = useState<string | null>(
    null,
  )

  return (
    <Card className="overflow-hidden rounded-xl border-border bg-card shadow-sm">
      <CardContent className="divide-y divide-border p-0">
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
      </CardContent>
    </Card>
  )
}
