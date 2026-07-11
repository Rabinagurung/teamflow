"use client"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useRequiredActiveWorkspace } from "@/hooks/use-active-workspace"
import { orpc } from "@/lib/orpc/orpc"
import { getWorkspaceColor } from "@/lib/utlis/get-workspace-color"
import { cn } from "@/lib/utlis/utils"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { startTransition } from "react"

const WorkspaceList = () => {
  const router = useRouter()
  const queryClient = useQueryClient()

  const workspaceListQuery = orpc.workspace.list.queryOptions()

  const { workspaces, currentWorkspace } = useRequiredActiveWorkspace()

  const switchWorkspace = useMutation(
    orpc.workspace.select.mutationOptions({
      onSuccess: ({ workspaceId }) => {
        startTransition(() => {
          router.push(`/workspace/${workspaceId}`)
          router.refresh()
        })

        void queryClient.invalidateQueries({
          queryKey: workspaceListQuery.queryKey,
        })

        void queryClient.invalidateQueries({
          queryKey: ["channel.list"],
        })

        void queryClient.invalidateQueries({
          queryKey: ["member.list"],
        })
      },
    }),
  )

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-2">
        {workspaces.map((workspace) => {
          const isActive = currentWorkspace.id === workspace.id
          const isSwitching =
            switchWorkspace.isPending &&
            switchWorkspace.variables?.workspaceId === workspace.id

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
                    switchWorkspace.mutate({ workspaceId: workspace.id })
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
