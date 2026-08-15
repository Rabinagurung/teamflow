import { Skeleton } from "@/components/ui/skeleton"
import { LoaderCircle } from "lucide-react"

export default function WorkspaceLoading() {
  return (
    <>
      <div className="flex h-full w-80 flex-col border-r border-channel-sidebar-border bg-channel-sidebar">
        <div className="flex h-14 items-center border-b border-channel-sidebar-border px-4">
          <Skeleton className="h-6 w-44" />
        </div>
        <div className="space-y-3 px-4 py-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-5/6" />
          <Skeleton className="h-7 w-4/6" />
        </div>
        <div className="mt-auto space-y-3 border-t border-channel-sidebar-border px-4 py-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-5/6" />
        </div>
      </div>
      <div className="grid flex-1 place-items-center bg-background">
        <LoaderCircle
          className="size-8 animate-spin text-primary"
          strokeWidth={1.75}
        />
      </div>
    </>
  )
}
