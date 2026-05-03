"use client"

import { orpc } from "@/lib/orpc/orpc"
import { cn } from "@/lib/utils/utils"
import { useMutation } from "@tanstack/react-query"
import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { getWorkspaceColor } from "../../workspace/_components/WorkspaceList"

type WorkspacePickerItemProps = {
  id: string
  name: string
  memberCount: number
}

export default function WorkspacePickerItem({
  id,
  name,
  memberCount,
}: WorkspacePickerItemProps) {
  const router = useRouter()

  const mutation = useMutation(
    orpc.workspace.select.mutationOptions({
      onSuccess: ({ workspaceId }) => {
        router.push(`/workspace/${workspaceId}`)
        router.refresh()
      },
    }),
  )

  const workspaceInitial = name.trim().charAt(0).toUpperCase()

  return (
    <button
      type="button"
      disabled={mutation.isPending}
      onClick={() => mutation.mutate({ workspaceId: id })}
      className="flex w-full items-center justify-between bg-transparent px-6 py-5 text-left transition hover:bg-muted/40 disabled:opacity-60"
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
            {memberCount} members
          </p>
        </div>
      </div>

      <ArrowRight className="size-5 shrink-0 text-muted-foreground" />
    </button>
  )

  // return (
  //   <Button
  //     type="button"
  //     disabled={mutation.isPending}
  //     onClick={() => mutation.mutate({ workspaceId: id })}
  //     className="flex w-full items-center justify-between border-b border-border px-6 py-5 text-left transition hover:bg-muted/40 last:border-b-0"
  //   >
  //     <div className="flex items-center gap-4">
  //       {/* <div className="grid size-12 place-items-center rounded-lg bg-zinc-600 tet-lg font-semibold text-white">
  //         {workspaceInitial}
  //       </div> */}
  //       <div
  //         className={cn(
  //           "grid size-12 shrink-0 place-items-center rounded-lg text-lg font-semibold text-white",
  //           getWorkspaceColor(id),
  //         )}
  //       >
  //         {workspaceInitial}
  //       </div>
  //       <div className="min-w-0">
  //         <p className="truncate text-xl font-semibold">{name}</p>
  //         <p className="text-sm text-muted-foreground">{memberCount} members</p>
  //       </div>
  //     </div>

  //     <ArrowRight className="size-5 text-foreground" />
  //   </Button>
  // )
}
