import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"
import { client } from "@/lib/orpc/orpc"
import { Cloud } from "lucide-react"
import { redirect } from "next/navigation"
import CreateNewChannel from "./_components/CreateNewChannel"

interface WorkspaceIdPageParams {
  params: Promise<{ workspaceId: string }>
}

const WorkspaceIdPage = async ({ params }: WorkspaceIdPageParams) => {
  const { workspaceId } = await params

  const { channels } = await client.channel.list()

  if (channels.length > 0) {
    return redirect(`/workspace/${workspaceId}/channel/${channels[0].id}`)
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
