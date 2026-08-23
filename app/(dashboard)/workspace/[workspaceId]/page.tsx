import "@/lib/orpc/orpc.server"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { orpc } from "@/lib/orpc/orpc"
import { getQueryClient } from "@/lib/query/hydration"
import { requireCurrentWorkspace } from "@/lib/workspace/current-workspace.server"
import { Cloud } from "lucide-react"
import { redirect } from "next/navigation"
import CreateNewChannel from "./_components/CreateNewChannel"
import MobileSidebarToggle from "./_components/MobileSidebarToggle"
import { workspaceQueryKeys } from "@/lib/query/workspace-query-keys"

const WorkspaceIdPage = async () => {
  const currentWorkspace = await requireCurrentWorkspace()
  const queryClient = getQueryClient()

  const channelListQuery = {
    ...orpc.channel.list.queryOptions(),
    queryKey: workspaceQueryKeys.channelList(currentWorkspace.id),
  }

  const { channels } = await queryClient.ensureQueryData(channelListQuery)

  const initialChannel =
    channels.find((channel) => channel.name === "general") ?? channels[0]

  if (initialChannel) {
    return redirect(
      `/workspace/${currentWorkspace.id}/channel/${initialChannel.id}`,
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-14 items-center border-b bg-channel-header px-4 lg:hidden">
        <MobileSidebarToggle />
      </div>
      <Empty className="from-muted/50 to-background h-full flex-1 bg-linear-to-b from-30% p-6 lg:p-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Cloud />
          </EmptyMedia>
          <EmptyTitle>No channels yet!</EmptyTitle>
          <EmptyDescription>
            Create your first channel to get started
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="max-w-xs mx-auto">
          <CreateNewChannel />
        </EmptyContent>
      </Empty>
    </div>
  )
}

export default WorkspaceIdPage
