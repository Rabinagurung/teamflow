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
import { workspaceQueryKeys } from "@/lib/query/workspace-query-keys"

const WorkspaceIdPage = async () => {
  const currentWorkspace = await requireCurrentWorkspace()
  const queryClient = getQueryClient()

  const { channels } = await queryClient.fetchQuery({
    ...orpc.channel.list.queryOptions(),
    queryKey: workspaceQueryKeys.channelList(currentWorkspace.id),
  })

  const initialChannel =
    channels.find((channel) => channel.name === "general") ?? channels[0]

  if (initialChannel) {
    return redirect(
      `/workspace/${currentWorkspace.id}/channel/${initialChannel.id}`,
    )
  }

  return (
    <div className="p-16 flex flex-1">
      <Empty className="from-muted/50 to-background h-full bg-linear-to-b from-30%">
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
