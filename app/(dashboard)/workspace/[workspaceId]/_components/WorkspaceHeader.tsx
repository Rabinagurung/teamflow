"use client"

import { useRequiredActiveWorkspace } from "@/hooks/use-active-workspace"

export function WorkspaceHeader() {
  const { currentWorkspace } = useRequiredActiveWorkspace()

  return (
    <h2 className="truncate text-lg font-semibold text-sidebar-foreground">
      {currentWorkspace.name}
    </h2>
  )
}

export default WorkspaceHeader
