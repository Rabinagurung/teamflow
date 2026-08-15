"use client"

import { useActiveWorkspace } from "@/hooks/use-active-workspace"
import { useParams, usePathname } from "next/navigation"
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

type WorkspaceSwitchContextValue = {
  targetWorkspaceId: string | null
  isSwitchingWorkspace: boolean
  startWorkspaceSwitch: (workspaceId: string) => void
  finishWorkspaceSwitch: () => void
}

type WorkspaceRouteParams = {
  workspaceId?: string | string[]
}

const WorkspaceSwitchContext =
  createContext<WorkspaceSwitchContextValue | null>(null)

export function WorkspaceSwitchProvider({ children }: { children: ReactNode }) {
  const { workspaceId: activeWorkspaceId } = useActiveWorkspace()
  const params = useParams<WorkspaceRouteParams>()
  const pathname = usePathname()
  const [targetWorkspaceId, setTargetWorkspaceId] = useState<string | null>(
    null,
  )

  const routeWorkspaceId = Array.isArray(params.workspaceId)
    ? params.workspaceId[0]
    : params.workspaceId

  const startWorkspaceSwitch = useCallback((workspaceId: string) => {
    setTargetWorkspaceId(workspaceId)
  }, [])

  const finishWorkspaceSwitch = useCallback(() => {
    setTargetWorkspaceId(null)
  }, [])

  useEffect(() => {
    if (!targetWorkspaceId) return

    if (!pathname.startsWith("/workspace")) {
      setTargetWorkspaceId(null)
      return
    }

    if (
      activeWorkspaceId === targetWorkspaceId &&
      routeWorkspaceId === targetWorkspaceId
    ) {
      setTargetWorkspaceId(null)
    }
  }, [activeWorkspaceId, pathname, routeWorkspaceId, targetWorkspaceId])

  const value = useMemo<WorkspaceSwitchContextValue>(
    () => ({
      targetWorkspaceId,
      isSwitchingWorkspace: targetWorkspaceId !== null,
      startWorkspaceSwitch,
      finishWorkspaceSwitch,
    }),
    [finishWorkspaceSwitch, startWorkspaceSwitch, targetWorkspaceId],
  )

  return (
    <WorkspaceSwitchContext.Provider value={value}>
      {children}
    </WorkspaceSwitchContext.Provider>
  )
}

export function useWorkspaceSwitch() {
  const context = useContext(WorkspaceSwitchContext)

  if (!context) {
    throw new Error(
      "useWorkspaceSwitch must be used within WorkspaceSwitchProvider",
    )
  }

  return context
}
