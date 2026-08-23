"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { orpc } from "@/lib/orpc/orpc"
import { ChannelRealtimeProvider } from "@/providers/ChannelRealtimeProvider"
import { ThreadProvider, useThread } from "@/providers/ThreadProvider"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import ChannelHeader from "./_components/ChannelHeader"
import MessageInputForm from "./_components/message/MessageInputForm"
import MessageList from "./_components/MessageList"
import ThreadSidebar from "./_components/thread/ThreadSidebar"
import MobileSidebarToggle from "../../_components/MobileSidebarToggle"

const ChannelPageMain = () => {
  const { channelId } = useParams<{ channelId: string }>()
  const { isThreadOpen } = useThread()

  const { data, error, isLoading } = useQuery(
    orpc.channel.get.queryOptions({
      input: {
        channelId: channelId,
      },
    }),
  )

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
    <ChannelRealtimeProvider channelId={channelId}>
      <div className="flex h-screen w-full bg-background">
        {/* Main Channel Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Fixed Header */}
          {isLoading ? (
            <div className="flex h-14 items-center justify-between gap-2 border-b bg-channel-header px-2 sm:px-4">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <MobileSidebarToggle />
                <Skeleton className="h-6 w-28 sm:w-40" />
              </div>
              <div className="flex shrink-0 items-center gap-1 sm:gap-3">
                <Skeleton className="size-8 sm:h-8 sm:w-28" />
                <Skeleton className="size-8 sm:h-8 sm:w-20" />
                <Skeleton className="size-8" />
              </div>
            </div>
          ) : (
            <ChannelHeader channelName={data?.channelName} />
          )}
          {/* Scrollable Message Area */}
          <div className="chat-canvas flex-1 overflow-hidden">
            <MessageList />
          </div>
          {/* Fixed Input */}
          <div className="border-t border-border bg-background p-4">
            <MessageInputForm channelId={channelId} />
          </div>
        </div>
        {isThreadOpen && <ThreadSidebar />}
      </div>
    </ChannelRealtimeProvider>
  )
}

const ThisIsChannelPage = () => {
  return (
    <ThreadProvider>
      <ChannelPageMain />
    </ThreadProvider>
  )
}

export default ThisIsChannelPage
