import SafeContent from "@/components/rich-text-editor/SafeContent"
import { Button } from "@/components/ui/button"
import { orpc } from "@/lib/orpc/orpc"
import { useThread } from "@/providers/ThreadProvider"
import { ThreadRealtimeProvider } from "@/providers/ThreadRealtimeProvider"
import { useQuery } from "@tanstack/react-query"
import { ChevronDown, MessageSquare, X } from "lucide-react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import SummarizeThread from "./SummarizeThread"
import ThreadReply from "./ThreadReply"
import ThreadReplyForm from "./ThreadReplyForm"
import ThreadSidebarSkeleton from "./ThreadSidebarSkeleton"

const ThreadSidebar = () => {
  const { selectedThreadId, closeThread } = useThread()

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const lastMessageCountRef = useRef(0)

  const [isAtBottom, setIsAtBottom] = useState(true)
  const [canScroll, setCanScroll] = useState(false)

  const { data, error, isLoading, isFetching, refetch } = useQuery(
    orpc.message.thread.list.queryOptions({
      input: {
        messageId: selectedThreadId!,
      },

      enabled: Boolean(selectedThreadId),

      //only fetch data if selectedThreadId is defined

      //not fetch the data for every thread, only fetch the data for open thread
    }),
  )

  const hasInitialLoadError = !data && !!error
  const messageCount = data?.messages.length ?? 0

  const isNearBottom = (element: HTMLDivElement) =>
    element.scrollHeight - element.scrollTop - element.clientHeight <= 80

  const handleScroll = () => {
    const element = scrollRef.current
    if (!element) return

    setIsAtBottom(isNearBottom(element))
    setCanScroll(element.scrollHeight > element.clientHeight + 24)
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
      setCanScroll(element.scrollHeight > element.clientHeight + 24)
      scrolltoBottomIfNeeded()
    })

    resizeObserver.observe(element)

    //MutationObserver watches DOM changes inside the container.

    const mutationObserver = new MutationObserver(() => {
      setCanScroll(element.scrollHeight > element.clientHeight + 24)
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

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    setCanScroll(element.scrollHeight > element.clientHeight + 24)
    setIsAtBottom(isNearBottom(element))
  }, [data])

  const scrollToBottom = () => {
    const element = scrollRef.current
    if (!element) return
    bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" })
    setIsAtBottom(true)
  }

  const showScrollToBottomButton =
    !!data && data.messages.length > 0 && canScroll && !isAtBottom

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
            {!hasInitialLoadError && (
              <SummarizeThread messageId={selectedThreadId!} />
            )}

            <Button variant="outline" size="icon" onClick={closeThread}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Main content */}
        {hasInitialLoadError ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="max-w-sm text-center">
              <p className="text-lg font-semibold">Failed to load thread</p>

              <p className="mt-2 text-sm text-muted-foreground">
                {error instanceof Error
                  ? error.message
                  : "Unable to load this thread right now."}
              </p>

              <div className="mt-4 flex justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  disabled={isFetching}
                >
                  {isFetching ? "Retrying..." : "Try again"}
                </Button>

                <Button variant="ghost" onClick={closeThread}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
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
                            content={data.parent.content}
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

              {showScrollToBottomButton && (
                <Button
                  type="button"
                  size="sm"
                  onClick={scrollToBottom}
                  className="absolute bottom-4 right-5 z-20 rounded-full transition-all hover:shadow-xl duration-200"
                >
                  <ChevronDown className="size-4" />
                </Button>
              )}
            </div>

            {selectedThreadId && (
              <div className="border-t p-4">
                <ThreadReplyForm threadId={selectedThreadId} />
              </div>
            )}
          </>
        )}
      </div>
    </ThreadRealtimeProvider>
  )
}

export default ThreadSidebar
