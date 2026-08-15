"use client"

import { useRequiredActiveWorkspace } from "@/hooks/use-active-workspace"
import { Skeleton } from "@/components/ui/skeleton"
import { orpc } from "@/lib/orpc/orpc"
import { workspaceQueryKeys } from "@/lib/query/workspace-query-keys"
import { ChannelRealtimeProvider } from "@/providers/ChannelRealtimeProvider"
import { ThreadProvider, useThread } from "@/providers/ThreadProvider"
import { useQuery } from "@tanstack/react-query"
import { LoaderCircle } from "lucide-react"
import { useParams } from "next/navigation"
import ChannelHeader from "./_components/ChannelHeader"
import MessageInputForm from "./_components/message/MessageInputForm"
import MessageList from "./_components/MessageList"
import ThreadSidebar from "./_components/thread/ThreadSidebar"
import { useWorkspaceSwitch } from "../../../_components/WorkspaceSwitchProvider"

type ChannelRouteParams = {
  workspaceId: string
  channelId: string
}

const ChannelTransitionLoader = () => {
  return (
    <div className="grid h-screen flex-1 place-items-center bg-background">
      <LoaderCircle
        className="size-8 animate-spin text-primary"
        strokeWidth={1.75}
      />
    </div>
  )
}

const ChannelPageContent = ({ workspaceId, channelId }: ChannelRouteParams) => {
  const { isThreadOpen } = useThread()

  const { data, error, isLoading } = useQuery({
    ...orpc.channel.get.queryOptions({
      input: {
        channelId,
        workspaceId,
      },
    }),
    queryKey: workspaceQueryKeys.channelDetail(workspaceId, channelId),
  })

  if (error) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">Failed to load channel</p>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error
              ? error.message
              : "An unexpected error occurred"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <ChannelRealtimeProvider workspaceId={workspaceId} channelId={channelId}>
      <div className="flex h-screen w-full bg-background">
        {/* Main Channel Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Fixed Header */}
          {isLoading ? (
            <div className="flex h-14 items-center justify-between border-b bg-channel-header px-4">
              <Skeleton className="h-6 w-40" />
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="size-8" />
              </div>
            </div>
          ) : (
            <ChannelHeader channelName={data?.channelName} />
          )}
          {/* Scrollable Message Area */}
          <div className="chat-canvas flex-1 overflow-hidden">
            <MessageList workspaceId={workspaceId} channelId={channelId} />
          </div>
          {/* Fixed Input */}
          <div className="border-t border-border bg-background p-4">
            <MessageInputForm workspaceId={workspaceId} channelId={channelId} />
          </div>
        </div>
        {isThreadOpen && <ThreadSidebar />}
      </div>
    </ChannelRealtimeProvider>
  )
}

const ChannelPageMain = () => {
  const { workspaceId, channelId } = useParams<ChannelRouteParams>()
  const { workspaceId: activeWorkspaceId } = useRequiredActiveWorkspace()
  const { isSwitchingWorkspace } = useWorkspaceSwitch()

  if (isSwitchingWorkspace || workspaceId !== activeWorkspaceId) {
    return <ChannelTransitionLoader />
  }

  return <ChannelPageContent workspaceId={workspaceId} channelId={channelId} />
}

const ThisIsChannelPage = () => {
  return (
    <ThreadProvider>
      <ChannelPageMain />
    </ThreadProvider>
  )
}

export default ThisIsChannelPage
