"use client"

import { orpc } from "@/lib/orpc/orpc"
import { getWorkspaceColor } from "@/lib/utlis/get-workspace-color"
import { cn } from "@/lib/utlis/utils"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowRight, LoaderCircle } from "lucide-react"
import { useRouter } from "next/navigation"

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
            queryKey: ["channel.list"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["member.list"],
          }),
        ])

        router.push(`/workspace/${workspaceId}`)
        router.refresh()
      },
      onError: () => onPendingChange(null),
    }),
  )

  const workspaceInitial = name.trim().charAt(0).toUpperCase()
  const isBusy = isPending || mutation.isPending

  const handleSelect = () => {
    onPendingChange(id)
    mutation.mutate({ workspaceId: id })
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleSelect}
      aria-busy={isBusy}
      className={cn(
        "cursor-pointer group flex w-full items-center justify-between bg-transparent px-6 py-5 text-left transition hover:bg-accent/40 disabled:cursor-wait disabled:opacity-60",
        isBusy && "bg-accent/30 disabled:opacity-100",
      )}
    >
      <div className="flex min-w-0 items-center gap-4">
        <div
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-xl text-lg font-semibold text-white",
            getWorkspaceColor(id),
          )}
        >
          {workspaceInitial}
        </div>

        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-foreground">
            {name}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isBusy ? "Opening workspace..." : `${memberCount} members`}
          </p>
        </div>
      </div>

      {isBusy ? (
        <LoaderCircle className="size-5 shrink-0 animate-spin text-primary" />
      ) : (
        <ArrowRight className="size-5 shrink-0 text-muted-foreground transition group-hover:text-primary" />
      )}
    </button>
  )
}
