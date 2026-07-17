"use client"

import EmptyState from "@/components/general/EmptyState"
import { Button } from "@/components/ui/button"
import { useRequiredActiveWorkspace } from "@/hooks/use-active-workspace"
import { orpc } from "@/lib/orpc/orpc"
import { useInfiniteQuery } from "@tanstack/react-query"
import { ChevronDown, Loader2 } from "lucide-react"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import MessageItem from "./message/MessageItem"

/**
 * Renders a Slack-style message list with reverse infinite scrolling.
 *
 * Behavior:
 * - Messages are displayed chronologically (oldest at top, newest at bottom).
 * - Older messages are loaded when the user scrolls near the top.
 * - On initial mount, the list auto-scrolls to the latest message.
 * - If new messages arrive while the user is not at the bottom,
 *   a floating "New Messages" button is displayed.
 *
 * Pagination model:
 * - Cursor-based pagination using the last message ID as the cursor.
 * - Pages are normalized on the client to maintain stable chronological order.
 *
 * This component is intentionally client-side to support scroll position
 * preservation and real-time UX patterns.
 */
const MessageList = () => {
  const { channelId } = useParams<{ channelId: string }>()

  // Indicates whether the initial scroll-to-bottom has been performed.
  // Prevents repeated auto-scrolling on re-renders.
  const [hasInitialScrolled, setHasInitialScrolled] = useState(false)

  // Scrollable container element.
  // All scroll position calculations are based on this element.
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const bottomRef = useRef<HTMLDivElement | null>(null)

  // Tracks the ID of the most recently rendered message.
  // Used to detect newly appended messages across renders.
  const lastItemIdRef = useRef<string | undefined>(undefined) //id of last message to detect if new messages arrived

  // Whether the user is currently positioned near the bottom of the list.
  // Determines auto-scroll behavior and UI state.
  const [isAtBottom, setIsAtBottom] = useState(false)

  // True when new messages arrive while the user is not near the bottom.
  // Controls visibility of the "New Messages" affordance.
  const [newMessages, setNewMessages] = useState(false) //newMessages arrive while scrolling up

  const infinitOptions = orpc.message.list.infiniteOptions({
    input: (pageParam: string | undefined) => ({
      channelId,
      cursor: pageParam,
      limit: 30,
    }),
    queryKey: ["message.list", channelId], //multiple channels and want to validate one channel
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: (data) => {
      // Build a stable derived list for rendering (Slack: oldest -> newest)
      const items = data.pages
        .slice() // copy
        .reverse() // oldest page first (assuming pages are newest->older)
        .flatMap((p) => p.items.slice().reverse()) // oldest->newest within page

      return { ...data, items }
    },
  })

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery({
    ...infinitOptions,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  //get current user from hook
  const { user } = useRequiredActiveWorkspace()

  /**
   * Default browser behavior:
   * - On initial render, scrollable containers start at the top (scrollTop = 0).
   * - This would show the oldest message in the currently loaded page
   *   instead of the most recent conversation context.
   *
   * Why this effect exists:
   * - Chat interfaces are expected to open at the latest messages.
   * - Once the first page of messages is rendered, this effect imperatively
   *   scrolls the container to the bottom.
   * - The guard (`hasInitialScrolled`) ensures this runs only once and does
   *   not interfere with user-initiated scrolling.
   */
  useEffect(() => {
    if (!hasInitialScrolled && data?.pages.length) {
      const element = scrollRef.current

      if (element) {
        bottomRef.current?.scrollIntoView({ block: "end" }) //moves the page to bottom
        setHasInitialScrolled(true)
        setIsAtBottom(true)
      }
    }
  }, [hasInitialScrolled, data?.pages.length])

  /**
   * Keep the viewport pinned to the bottom when the user is already near the bottom.
   * This handles "late content growth" (e.g., images loading, embeds expanding) that can
   * increase message height after initial render and otherwise push the view upward.
   */
  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    /**
     * Scroll to bottom only when:
     * - initial scroll-to-bottom has already occurred, and
     * - the user is currently near the bottom (i.e., they haven't scrolled up to read history)
     */
    const scrollToBottomIfNeeded = () => {
      //isAtBottom and initialScroll hasn't happened yet
      if (isAtBottom && hasInitialScrolled) {
        requestAnimationFrame(() => {
          bottomRef.current?.scrollIntoView({ block: "end" })
        })
      }
    }

    /**
     * Image load handler:
     * When an <img> finishes loading it can change layout/height, so we re-pin if needed.
     *
     * Note: We check `event.target` to ensure we're responding only to image load events.
     */
    const onImageLoad = (e: Event) => {
      if (e.target instanceof HTMLImageElement) {
        scrollToBottomIfNeeded()
      }
    }

    /**
     * Listen for descendant image load events.
     * IMPORTANT: The 'load' event does NOT bubble, so we use capture (`true`)
     * to intercept load events from child elements.
     */
    element.addEventListener("load", onImageLoad, true)

    /**
     * ResizeObserver watches size changes of the observed element (the scroll container).
     * This can fire when layout changes cause the container's box size to change.
     *
     * Note: If the scroll container has a fixed height (common), its size may not change
     * even when content grows—so this observer may be redundant depending on layout.
     */
    const resizeObserver = new ResizeObserver(() => {
      scrollToBottomIfNeeded()
    })
    resizeObserver.observe(element)

    /*MutationObserver detect any DOM changes within the container itselementf
    //eg: image loading, content updates
    //If images are loading or in general if we have content updates*/
    const mutationObserver = new MutationObserver(() => {
      scrollToBottomIfNeeded()
    })

    /**
     * MutationObserver watches DOM changes inside the container.
     * Useful when new messages are inserted or existing message nodes update.
     *
     * Performance note: Observing attributes + characterData can be expensive in a chat UI.
     * Enable them only if you truly need to react to edits/attribute changes.
     */
    mutationObserver.observe(element, {
      childList: true, // nodes added/removed (e.g., new messages)
      subtree: true, // include descendants, not just direct children
      attributes: true, // attribute changes (e.g., className/src)
      characterData: true, // text node changes (e.g., edits)
    })

    /**
     * Cleanup:
     * Disconnect observers and remove event listeners to prevent leaks and duplicate handlers
     * when the effect re-runs.
     */
    return () => {
      resizeObserver.disconnect()
      element.removeEventListener("load", onImageLoad, true)
      mutationObserver.disconnect()
    }
  }, [isAtBottom, hasInitialScrolled])

  /**
   * Determines whether the scroll position is within a defined threshold
   * of the bottom of the container.
   *
   * @param element - Scroll container element
   * @returns `true` if the user is near the bottom
   */
  const isNearBottom = (element: HTMLDivElement) =>
    element.scrollHeight - element.scrollTop - element.clientHeight <= 80

  /**
   * Handles scroll events on the message container.
   * - Triggers fetching of older messages when near the top.
   * - Preserves scroll position after loading previous pages.
   * - Updates isAtBottom state for new message detection.
   */
  const handleScroll = () => {
    const element = scrollRef.current
    if (!element) return

    if (element.scrollTop <= 80 && hasNextPage && !isFetching) {
      const previousScrollHeight = element.scrollHeight
      const previousScrollTop = element.scrollTop

      fetchNextPage().then(() => {
        //After adding old messages -> scrollHeight of message list increases having new scroll height
        const newScrollHeight = element.scrollHeight

        element.scrollTop =
          newScrollHeight - previousScrollHeight + previousScrollTop
      })
    }

    setIsAtBottom(isNearBottom(element))
  }

  const items = useMemo(() => {
    return data?.items ?? []
  }, [data])

  const hasInitialLoadError = !data && !!error
  const isEmpty = !isLoading && !hasInitialLoadError && items.length === 0

  /**
   * Detects newly appended messages and adjusts scroll behavior accordingly.
   *
   * - If the user is near the bottom, auto-scrolls to reveal the new message.
   * - Otherwise, surfaces a "New Messages" button without disrupting reading.
   */
  useEffect(() => {
    if (!items.length) return

    const lastId = items[items.length - 1].id

    //capture previous id
    const previousLastId = lastItemIdRef.current

    // read cuurent scroll container ref
    const element = scrollRef.current

    if (previousLastId && lastId !== previousLastId) {
      //condition passed -> have new items
      if (element && isNearBottom(element)) {
        //if user is near bottom, scroll to bottom
        requestAnimationFrame(() => {
          element.scrollTop = element.scrollHeight
        })

        setNewMessages(false)
        setIsAtBottom(true)
      } else {
        //if user is on top(not near bottom), we will display a button -> clicking -> scrolls the user to new message at bottom
        setNewMessages(true)
      }
    }

    lastItemIdRef.current = lastId
  }, [items])

  /**
   * Scrolls the message list to the latest message
   * and clears the new message indicator.
   */
  const scrollToBottom = () => {
    const element = scrollRef.current
    if (!element) return

    bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" })

    setNewMessages(false)
    setIsAtBottom(true)
  }

  if (hasInitialLoadError) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-sm text-center">
          <p className="text-lg font-semibold">Failed to load messages</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {error instanceof Error
              ? error.message
              : "Unable to load this conversation right now."}
          </p>

          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? "Retrying..." : "Try again"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      <div
        className="flex h-full flex-col space-y-1 overflow-y-auto px-4 py-4"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {isEmpty ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              title="No message yet"
              description="Start the conversation by sending the first message"
              buttonText="Send a message"
              href="#"
            />
          </div>
        ) : (
          <div className="flex w-full flex-col gap-0.5">
            {items.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                currentUserId={user.id}
              />
            ))}
          </div>
        )}
        {isFetching && !isFetchingNextPage ? (
          <div className="py-2 text-center text-sm text-muted-foreground">
            Loading....
          </div>
        ) : null}

        <div ref={bottomRef}></div>
      </div>

      {isFetchingNextPage && (
        <div
          className="absolute pointer-events-none top-0 left-0 
        right-0 z-20 flex items-center justify-center py-2"
        >
          <div
            className="flex items-center gap-2 rounded-md bg-gradient-to-b 
          from-white/80 to-transparent dark:from-neutral-900/80 backdrop-blur px-3 py-1"
          >
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
            <span>Loading previous messages...</span>
          </div>
        </div>
      )}

      {!isAtBottom && (
        <Button
          type="button"
          size="sm"
          className="absolute bottom-4 right-5 z-20 rounded-full hover:shadow-xl transition-all duration-200 "
          onClick={scrollToBottom}
        >
          <ChevronDown className="size-4" />
          {newMessages && <span>New Message</span>}
        </Button>
      )}
    </div>
  )
}

export default MessageList
