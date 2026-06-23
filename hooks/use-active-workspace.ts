"use client"

import { orpc } from "@/lib/orpc/orpc"
import { useSuspenseQuery } from "@tanstack/react-query"

// hooks/use-active-workspace.ts
export function useActiveWorkspace() {
  const { data } = useSuspenseQuery(orpc.workspace.list.queryOptions())

  const currentWorkspace = data.currentWorkspace
  const currentWorkspaceRole = data.currentWorkspaceRole
  const canManageWorkspace =
    currentWorkspaceRole === "owner" || currentWorkspaceRole === "admin"

  return {
    currentWorkspace,
    currentWorkspaceRole,
    canManageWorkspace,
    workspaceId: currentWorkspace?.id ?? null,
    workspacePath: currentWorkspace
      ? `/workspace/${currentWorkspace.id}`
      : null,
    presenceRoom: currentWorkspace ? `workspace-${currentWorkspace.id}` : null,
    user: data.user,
    workspaces: data.workspaces,
  }
}

export function useRequiredActiveWorkspace() {
  const workspace = useActiveWorkspace()

  if (!workspace.currentWorkspace) {
    throw new Error(
      "useRequiredActiveWorkspace must be used inside a workspace-scoped UI tree",
    )
  }

  return {
    currentWorkspace: workspace.currentWorkspace,
    currentWorkspaceRole: workspace.currentWorkspaceRole,
    canManageWorkspace: workspace.canManageWorkspace,
    workspaceId: workspace.currentWorkspace.id,
    workspacePath: `/workspace/${workspace.currentWorkspace.id}`,
    presenceRoom: `workspace-${workspace.currentWorkspace.id}`,
    user: workspace.user,
    workspaces: workspace.workspaces,
  }
}
