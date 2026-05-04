"use client"

import { orpc } from "@/lib/orpc/orpc"
import { useSuspenseQuery } from "@tanstack/react-query"

export function WorkspaceHeader() {
  const {
    data: { currentWorkspace },
  } = useSuspenseQuery(orpc.channel.list.queryOptions())
  return (
    <h2 className="truncate text-lg font-semibold text-sidebar-foreground">
      {currentWorkspace.orgName}
    </h2>
  )
}

export default WorkspaceHeader
