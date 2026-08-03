"use client"

import { Card, CardContent } from "@/components/ui/card"
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
    <Card className="h-full overflow-hidden rounded-xl border-border bg-card py-0 shadow-sm">
      <CardContent className="h-full divide-y divide-border overflow-y-auto p-0">
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
