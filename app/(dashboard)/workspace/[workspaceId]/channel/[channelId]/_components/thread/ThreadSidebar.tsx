import { Button } from "@/components/ui/button"
import { ChevronDown, MessageSquare, X } from "lucide-react"
import Image from "next/image"
import React, { useEffect, useRef, useState } from "react"
import ThreadReply from "./ThreadReply"
import ThreadReplyForm from "./ThreadReplyForm"
import { useThread } from "@/providers/ThreadProvider"
import { useQuery } from "@tanstack/react-query"
import { orpc } from "@/lib/orpc"
import SafeContent from "@/components/rich-text-editor/SafeContent"
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs"
import ThreadSidebarSkeleton from "./ThreadSidebarSkeleton"
import SummarizeThread from "./SummarizeThread"
import { ThreadRealtimeProvider } from "@/providers/ThreadRealtimeProvider"

interface ThreadSidebarProps {
  user: KindeUser<Record<string, unknown>>
}

const ThreadSidebar = ({ user }: ThreadSidebarProps) => {
  const { selectedThreadId, closeThread } = useThread()
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const lastMessageCountRef = useRef(0)
  const [isAtBottom, setIsAtBottom] = useState(false)

  const { data, isLoading } = useQuery(
    orpc.message.thread.list.queryOptions({
      input: {
        messageId: selectedThreadId!,
      },
      enabled: Boolean(selectedThreadId),
      //only fetch data if selectedThreadId is defined
      //not fetch the data for every thread, only fetch the data for open thread
    }),
  )

  const messageCount = data?.messages.length ?? 0

  const isNearBottom = (element: HTMLDivElement) =>
    element.scrollHeight - element.scrollTop - element.clientHeight <= 80

  const handleScroll = () => {
    const element = scrollRef.current
    if (!element) return

    setIsAtBottom(isNearBottom(element))
  }

  // Enables auto scroll when new reply arrived
  useEffect(() => {
    if (messageCount === 0) return

    const previousMessageCount = lastMessageCountRef.current
    const element = scrollRef.current

    //previousMessageCount > 0: only run if messages count tracked before
    //messageCount !== previousMessageCount: only run if count has actually changed
    if (previousMessageCount > 0 && messageCount !== previousMessageCount) {
      //scroll element exists and user is currently near bottom within 80px
      if (element && isNearBottom(element)) {
        requestAnimationFrame(() => {
          bottomRef.current?.scrollIntoView({
            block: "end",
            behavior: "smooth",
          })
        })
        setIsAtBottom(true)
      }
    }

    //updates lastMessageCountRef with current messageCount to detect next change in messages list
    lastMessageCountRef.current = messageCount
  }, [messageCount])

  //Keep the viewport pinned to the bottom on late content growth
  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    const scrolltoBottomIfNeeded = () => {
      if (isAtBottom) {
        requestAnimationFrame(() => {
          bottomRef.current?.scrollIntoView({ block: "end" })
        })
      }
    }

    const onImageLoad = (e: Event) => {
      if (e.target instanceof HTMLImageElement) {
        scrolltoBottomIfNeeded()
      }
    }

    element.addEventListener("load", onImageLoad, true)

    //ResizeObserver watches size changes of the observed element (the scroll container).
    const resizeObserver = new ResizeObserver(() => {
      scrolltoBottomIfNeeded()
    })

    resizeObserver.observe(element)

    //MutationObserver watches DOM changes inside the container.
    const mutationObserver = new MutationObserver(() => {
      scrolltoBottomIfNeeded()
    })

    mutationObserver.observe(element, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    })

    return () => {
      resizeObserver.disconnect()
      element.removeEventListener("load", onImageLoad, true)
      mutationObserver.disconnect()
    }
  }, [isAtBottom])

  const scrollToBottom = () => {
    const element = scrollRef.current
    if (!element) return

    bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" })

    setIsAtBottom(true)
  }

  if (isLoading) {
    return <ThreadSidebarSkeleton />
  }

  return (
    <ThreadRealtimeProvider threadId={selectedThreadId!}>
      <div className="w-[30rem] border-l flex flex-col h-full">
        {/* Header */}
        <div className="h-14 border-b px-4 flex items-center justify-between">
          <div className="flex gap-2 items-center">
            <MessageSquare className="size-4" />
            <span>Thread</span>
          </div>
          <div className="flex items-center gap-2">
            <SummarizeThread messageId={selectedThreadId!} />

            <Button variant="outline" size="icon" onClick={closeThread}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="relative flex-1 overflow-y-auto">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="h-full overflow-y-auto"
          >
            {data && (
              <>
                {/* Parent message */}
                <div className="p-4 border-b bg-muted/20">
                  <div className="flex space-x-3">
                    <Image
                      src={data.parent.authorAvatar}
                      alt="Author Image"
                      width={32}
                      height={32}
                      className="size-8 rounded-full shrink-0 "
                    />

                    <div className="flex-1 space-y-1 min-w-0 ">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">
                          {data.parent.authorName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Intl.DateTimeFormat("en-US", {
                            hour: "numeric",
                            minute: "numeric",
                            hour12: true,
                            month: "short",
                            day: "numeric",
                          }).format(data.parent.createdAt)}
                        </span>
                      </div>
                      <SafeContent
                        className="text-sm break-words prose dark:prose-invert max-w-none"
                        content={JSON.parse(data.parent.content)}
                      />
                    </div>
                  </div>
                </div>

                {/* Thread replies under parent message */}
                <div className="p-2">
                  <p className="text-xs text-muted-foreground mb-3 px-2">
                    {data.messages.length}{" "}
                    {data.messages.length === 1 ? "reply" : "replies"}
                  </p>
                  <div className="space-y-1">
                    {selectedThreadId &&
                      data.messages.map((reply) => (
                        <ThreadReply
                          key={reply.id}
                          message={reply}
                          selectedThreadId={selectedThreadId}
                        />
                      ))}
                  </div>
                </div>
                <div ref={bottomRef}></div>
              </>
            )}
          </div>

          {!isAtBottom && (
            <Button
              type="button"
              size="sm"
              onClick={scrollToBottom}
              className="absolute bottom-4 right-5 z-20 rounded-full hover:shadow-xl
            transition-all duration-200"
            >
              <ChevronDown className="size-4" />
            </Button>
          )}
        </div>

        {/* Thread Reply Form */}
        {selectedThreadId && (
          <div className="border-t p-4">
            <ThreadReplyForm threadId={selectedThreadId} user={user} />
          </div>
        )}
      </div>
    </ThreadRealtimeProvider>
  )
}

export default ThreadSidebar
