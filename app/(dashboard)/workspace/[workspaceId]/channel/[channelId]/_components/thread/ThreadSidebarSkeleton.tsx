import { Skeleton } from "@/components/ui/skeleton"

const ThreadSidebarSkeleton = () => {
  return (
    <div className="fixed inset-x-0 top-0 z-50 flex h-dvh min-h-0 w-full flex-col overflow-hidden overscroll-none bg-background lg:static lg:z-auto lg:h-full lg:w-[30rem] lg:border-l">
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <div className="flex gap-x-2 items-center">
          <Skeleton className="size-4" />
          <Skeleton className="h-4 w-16" />
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="size-8" />
        </div>
      </div>
      {/* Main content */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {/* Parent message */}
        <div className="p-4 border-b bg-muted/20">
          <div className="flex space-x-3">
            <Skeleton className="size-8 rounded-full shrink-0" />

            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </div>

        {/* Thread replies under parent message */}
        <div className="p-2">
          <div className="px-2 mb-3">
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="space-y-3">
            {/* Reply Skeletons */}

            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex space-x-3 px-2">
                <Skeleton className="size-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <Skeleton className="h-4 w-full " />
                    <Skeleton className="h-4 w-2/3 " />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t p-4">
        <Skeleton className="h-56 w-full rounded-md" />
      </div>
    </div>
  )
}

export default ThreadSidebarSkeleton
