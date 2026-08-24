import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { orpc } from "@/lib/orpc/orpc"
import { getWorkspaceColor } from "@/lib/utlis/get-workspace-color"
import { cn } from "@/lib/utlis/utils"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowRight, LoaderCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { getWorkspaceSwitchErrorMessage } from "../../workspace/_components/get-workspace-switch-error-message"
import { workspaceQueryKeys } from "@/lib/query/workspace-query-keys"

type WorkspacePickerItemProps = {
  id: string
  name: string
  memberCount: number
  disabled?: boolean
  isPending?: boolean
  onPendingChange: (id: string | null) => void
}

export default function WorkspacePickerItem({
  id,
  name,
  memberCount,
  disabled,
  isPending,
  onPendingChange,
}: WorkspacePickerItemProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const mutation = useMutation(
    orpc.workspace.select.mutationOptions({
      onSuccess: async ({ workspaceId }) => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: orpc.workspace.list.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: workspaceQueryKeys.channelList(workspaceId),
          }),
          queryClient.invalidateQueries({
            queryKey: workspaceQueryKeys.memberList(workspaceId),
          }),
        ])

        router.push(`/workspace/${workspaceId}`)
        router.refresh()
      },

      onError: (error) => {
        toast.error(getWorkspaceSwitchErrorMessage(error))
      },
      onSettled: () => {
        onPendingChange(null)
      },
    }),
  )

  const workspaceInitial = name.trim().charAt(0).toUpperCase()
  const isBusy = isPending || mutation.isPending

  const handleSelect = () => {
    onPendingChange(id)
    mutation.mutate({ workspaceId: id })
  }

  return (
    <DropdownMenuItem
      disabled={disabled}
      aria-busy={isBusy}
      onSelect={(event) => {
        event.preventDefault()
        handleSelect()
      }}
      className={cn(
        "group flex cursor-pointer items-center justify-between gap-4 rounded-lg px-3 py-3 focus:bg-accent/40 data-[disabled]:cursor-wait data-[disabled]:opacity-60",
        isBusy && "bg-accent/30",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-lg text-base font-semibold text-white",
            getWorkspaceColor(id),
          )}
        >
          {workspaceInitial}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {name}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isBusy ? "Opening workspace..." : `${memberCount} members`}
          </p>
        </div>
      </div>

      {isBusy ? (
        <LoaderCircle className="size-4 shrink-0 animate-spin text-primary" />
      ) : (
        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
      )}
    </DropdownMenuItem>
  )
}
