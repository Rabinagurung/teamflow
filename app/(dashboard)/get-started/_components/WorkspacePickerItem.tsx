"use client"

import { orpc } from "@/lib/orpc/orpc"
import { useMutation } from "@tanstack/react-query"
import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

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

  return (
    <button
      type="button"
      onClick={() => mutation.mutate({ workspaceId: id })}
      className="flex w-full items-center justify-between border-b border-border px-6 py-5 text-left transition hover:bg-muted/40 last:border-b-0"
    >
      <div className="flex items-center gap-4">
        <div className="grid size-12 place-items-center rounded-lg bg-zinc-600 tet-lg font-semibold text-white">
          {name}
        </div>
        <div>
          <p className="text-xl font-semibold">{name}</p>
          <p className="text-sm text-muted-foreground">{memberCount} members</p>
        </div>
      </div>

      <ArrowRight className="size-5 text-foreground" />
    </button>
  )
}
