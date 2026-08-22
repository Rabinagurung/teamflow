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
import {
  isChannelScopedQuery,
  workspaceQueryKeys,
} from "@/lib/query/workspace-query-keys"
import { getWorkspaceColor } from "@/lib/utlis/get-workspace-color"
import { cn } from "@/lib/utlis/utils"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { startTransition } from "react"
import { toast } from "sonner"
import { getWorkspaceSwitchErrorMessage } from "./get-workspace-switch-error-message"
import { useWorkspaceSwitch } from "./WorkspaceSwitchProvider"

const WorkspaceList = () => {
  const router = useRouter()
  const queryClient = useQueryClient()

  const workspaceListQuery = orpc.workspace.list.queryOptions()

  const { workspaces, currentWorkspace } = useRequiredActiveWorkspace()
  const {
    isSwitchingWorkspace,
    startWorkspaceSwitch,
    finishWorkspaceSwitch,
    targetWorkspaceId,
  } = useWorkspaceSwitch()

  const switchWorkspace = useMutation(
    orpc.workspace.select.mutationOptions({
      onMutate: async ({ workspaceId }) => {
        startWorkspaceSwitch(workspaceId)

        await queryClient.cancelQueries({
          predicate: isChannelScopedQuery,
        })
        queryClient.removeQueries({
          predicate: isChannelScopedQuery,
        })
      },

      onSuccess: async ({ workspaceId }) => {
        await queryClient.cancelQueries({
          predicate: isChannelScopedQuery,
        })
        queryClient.removeQueries({
          predicate: isChannelScopedQuery,
        })

        startTransition(() => {
          router.push(`/workspace/${workspaceId}`)
          router.refresh()
        })

        void queryClient.invalidateQueries({
          queryKey: workspaceListQuery.queryKey,
        })

        void queryClient.invalidateQueries({
          queryKey: workspaceQueryKeys.channelList(workspaceId),
        })

        void queryClient.invalidateQueries({
          queryKey: workspaceQueryKeys.memberList(workspaceId),
        })
      },

      onError: (error) => {
        finishWorkspaceSwitch()
        toast.error(getWorkspaceSwitchErrorMessage(error))
      },
    }),
  )

  const otherWorkspaces = workspaces.filter(
    (workspace) => workspace.id !== currentWorkspace.id,
  )

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center gap-5">
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              aria-current="true"
              className={cn(
                "flex size-9 items-center justify-center rounded-xl border border-white/10 text-white shadow-sm",
                getWorkspaceColor(currentWorkspace.id),
              )}
            >
              <span className="text-lg font-bold">
                {currentWorkspace.name?.charAt(0)?.toUpperCase() ?? "M"}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{currentWorkspace.name} (Current)</p>
          </TooltipContent>
        </Tooltip>
        <div className="flex flex-col gap-2">
          {otherWorkspaces.map((workspace) => {
            const isSwitching =
              targetWorkspaceId === workspace.id ||
              (switchWorkspace.isPending &&
                switchWorkspace.variables?.workspaceId === workspace.id)

            return (
              <Tooltip key={workspace.id}>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    type="button"
                    disabled={isSwitchingWorkspace || isSwitching}
                    aria-label={`Switch to ${workspace.name}`}
                    onClick={() => {
                      switchWorkspace.mutate({ workspaceId: workspace.id })
                    }}
                    className={cn(
                      "size-9 rounded-xl text-white opacity-60 saturate-75 transition-all duration-200 hover:rounded-lg hover:opacity-60 hover:saturate-100",
                      getWorkspaceColor(workspace.id),
                      isSwitching && "opacity-60",
                    )}
                  >
                    <span className="text-sm font-semibold">
                      {workspace.avatar}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{workspace.name}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
}

export default WorkspaceList
