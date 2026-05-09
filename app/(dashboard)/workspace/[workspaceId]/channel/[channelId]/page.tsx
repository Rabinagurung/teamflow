"use client"

import { useParams } from "next/navigation"
import ChannelHeader from "./_components/ChannelHeader"
import MessageInputForm from "./_components/message/MessageInputForm"
import MessageList from "./_components/MessageList"
import { useQuery } from "@tanstack/react-query"
import { orpc } from "@/lib/orpc/orpc"
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs"
import { Skeleton } from "@/components/ui/skeleton"
import ThreadSidebar from "./_components/thread/ThreadSidebar"
import { ThreadProvider, useThread } from "@/providers/ThreadProvider"
import { ChannelRealtimeProvider } from "@/providers/ChannelRealtimeProvider"

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
      <div className="flex items-center justify-center h-screen">
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
            <MessageList />
          </div>
          {/* Fixed Input */}
          <div className="border-t border-border bg-background p-4">
            <MessageInputForm
              channelId={channelId}
              user={data?.currentUser as KindeUser<Record<string, unknown>>}
            />
          </div>
        </div>
        {isThreadOpen && data?.currentUser && (
          <ThreadSidebar
            user={data.currentUser as KindeUser<Record<string, unknown>>}
          />
        )}
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
