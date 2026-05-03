"use client"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { authClient } from "@/lib/auth/auth-client"
import { orpc } from "@/lib/orpc/orpc"
import { cn } from "@/lib/utils/utils"
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { startTransition } from "react"

const colorCombinations = [
  "bg-blue-500 hover:bg-blue-600 text-white",
  "bg-emerald-500 hover:bg-emerald-600 text-white",
  "bg-purple-500 hover:bg-purple-600 text-white",
  "bg-amber-500 hover:bg-amber-600 text-white",
  "bg-rose-500 hover:bg-rose-600 text-white",
  "bg-indigo-500 hover:bg-indigo-600 text-white",
  "bg-cyan-500 hover:bg-cyan-600 text-white",
  "bg-pink-500 hover:bg-pink-600 text-white",
]

export const getWorkspaceColor = (id: string) => {
  const charSum = id
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0)

  const colorIndex = charSum % colorCombinations.length

  return colorCombinations[colorIndex]
}

const WorkspaceList = () => {
  const router = useRouter()
  const queryClient = useQueryClient()

  const workspaceListQuery = orpc.workspace.list.queryOptions()
  const {
    data: { workspaces, currentWorkspace },
  } = useSuspenseQuery(workspaceListQuery)

  const switchWorkspace = useMutation({
    mutationFn: async (workspaceId: string) => {
      const { error } = await authClient.organization.setActive({
        organizationId: workspaceId,
      })

      if (error) {
        throw new Error(error.message || "Failed to switch workspace")
      }

      return workspaceId
    },

    onSuccess: async (workspaceId) => {
      await queryClient.invalidateQueries({
        queryKey: workspaceListQuery.queryKey,
      })

      startTransition(() => {
        router.push(`/workspace/${workspaceId}`)
        router.refresh()
      })
    },
  })

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-2">
        {workspaces.map((workspace) => {
          const isActive = currentWorkspace?.id === workspace.id
          const isSwitching =
            switchWorkspace.isPending &&
            switchWorkspace.variables === workspace.id

          return (
            <Tooltip key={workspace.id}>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  type="button"
                  disabled={isSwitching}
                  aria-pressed={isActive}
                  aria-label={`Switch to ${workspace.name}`}
                  onClick={() => {
                    if (isActive) {
                      router.push(`/workspace/${workspace.id}`)
                      return
                    }
                    switchWorkspace.mutate(workspace.id)
                  }}
                  className={cn(
                    "size-12 transition-all duration-200",
                    getWorkspaceColor(workspace.id),
                    isActive ? "rounded-lg" : "rounded-xl hover:rounded-lg",
                    isSwitching && "opacity-80",
                  )}
                >
                  <span className="text-sm font-semibold">
                    {workspace.avatar}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>
                  {workspace.name} {isActive && "(Current)"}
                </p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}

export default WorkspaceList
