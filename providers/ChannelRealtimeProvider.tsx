import {
  ChannelEventSchema,
  RealtimeMessageSchema,
} from "@/app/schemas/realtime"
import { InfiniteData, useQueryClient } from "@tanstack/react-query"
import usePartySocket from "partysocket/react"
import { createContext, useContext, useMemo } from "react"
import { z } from "zod"

/**
 * Value exposed via ChannelRealtimeContext.
 * Consumers can send validated channel events to the server.
 */
type ChannelRealtimeContextValueType = {
  send: (event: z.infer<typeof ChannelEventSchema>) => void
}

interface ChannelRealtimeProviderProps {
  /** Channel identifier used to select the websocket room name. */
  channelId: string
  children: React.ReactNode
}

type RealtimeMessageListPage = {
  items: z.infer<typeof RealtimeMessageSchema>[]
  nextCursor?: string
}

type RealtimeInfiniteMessages = InfiniteData<RealtimeMessageListPage>

//Context used to expose a stable `send()` API to child components.
const ChannelRealtimeContext =
  createContext<ChannelRealtimeContextValueType | null>(null)

export function ChannelRealtimeProvider({
  channelId,
  children,
}: ChannelRealtimeProviderProps) {
  const queryClient = useQueryClient() //mainpulate the cache in Tanstack query

  /**
   * ChannelRealtimeProvider
   *
   * Establishes a PartySocket WebSocket connection for a single channel room and
   * applies incoming realtime events to the TanStack Query cache.
   *
   * High-level flow:
   * - Provider creates a websocket connection tied to `room = channel-${channelId}`.
   * - Server broadcasts channel events to other clients in the same room.
   * - `onMessage` validates events with Zod and updates the cached infinite list.
   *
   * Important behavior note:
   * If the server broadcasts events excluding the sender, the sender will NOT receive
   * its own event back through `onMessage`. The sender UI should update via optimistic
   * updates or local cache updates after mutations.
   */
  const socket = usePartySocket({
    /**
     * Creates a websocket connection to PartyServer/PartyKit.
     *
     * - host: Worker endpoint that routes requests to the correct Durable Object instance
     * - party: backend PartyServer class name
     * - room: logical room name (mapped to a Durable Object instance)
     */
    host: "localhost:8787",
    room: `channel-${channelId}`,
    party: "chat",

    /**
     * Handles incoming websocket messages from the server.
     *
     * Expected inbound payload:
     * - a JSON string representing a ChannelEventSchema event
     *
     * Behavior:
     * - Parse JSON
     * - Validate against ChannelEventSchema
     * - Apply updates to TanStack Query cache (infinite message list)
     *
     * @param e - MessageEvent containing the raw websocket payload in `e.data`.
     */
    onMessage(e) {
      try {
        // In this app, events are serialized as JSON strings over the WebSocket.
        const parsedData = JSON.parse(e.data)

        // Validate message structure and ignore anything that does not match our protocol
        const result = ChannelEventSchema.safeParse(parsedData)

        if (!result.success) {
          console.warn("Invalid channel event")
          return
        }

        const event = result.data

        /**
         * message:created
         * Prepend the new message to the first page of the cached infinite query.
         */
        if (event.type === "message:created") {
          const raw = event.payload.message

          //Insert at top of first page of Infinite List for the channel
          queryClient.setQueryData<RealtimeInfiniteMessages>(
            ["message.list", channelId],
            (old) => {
              // If no cache exists yet, initialize an infinite-query-shaped cache value.
              if (!old) {
                return {
                  pages: [{ items: [raw], nextCursor: undefined }],
                  pageParams: [undefined],
                } as RealtimeInfiniteMessages
              }

              // Prepend to the first page (most recent messages at the top).
              const firstPage = old.pages[0]

              const updatedFirstPage: RealtimeMessageListPage = {
                ...firstPage, //preserve nextCursor and pre-append the items by adding new raw message to existing message items
                items: [raw, ...firstPage.items],
              }

              //Reconstruct Infinite Query structure and return updated first page while keeping exisiting pages
              return {
                ...old, //preserve pageParams and update the pages only
                pages: [updatedFirstPage, ...old.pages.slice(1)],
              }
            },
          )
          return
        }

        /**
         * message:updated
         * Replace a message in the cached infinite query by matching message.id.
         */
        if (event.type === "message:updated") {
          const updated = event.payload.message

          //replace the message in the infinite list by id
          queryClient.setQueryData<RealtimeInfiniteMessages>(
            ["message.list", channelId],
            (old) => {
              if (!old) return old

              const pages = old.pages.map((page) => ({
                ...page, //preserve nextCursor
                items: page.items.map((message) =>
                  message.id === updated.id
                    ? { ...message, ...updated }
                    : message,
                ),
              }))

              return {
                ...old, //preseve pageParams
                pages,
              }
            },
          )
          return
        }

        /**
         * reaction:udpated
         * Update reaction aggregates for a given message ID.
         * (Note: event name has a typo; keep consistent across server/client schemas.)
         */
        if (event.type === "reaction:updated") {
          const { messageId, reactions: currentReactions } = event.payload

          queryClient.setQueryData<RealtimeInfiniteMessages>(
            ["message.list", channelId],
            (old) => {
              if (!old) return old

              const pages = old.pages.map((page) => ({
                ...page,
                items: page.items.map(
                  (message: z.infer<typeof RealtimeMessageSchema>) => {
                    if (message.id !== messageId) return message

                    const prevReactions = message.reactions ?? []

                    // Preserve reactedByMe from previous cache
                    const merged = currentReactions.map((currentR) => {
                      const prevMatch = prevReactions.find(
                        (prevR) => prevR.emoji === currentR.emoji,
                      )
                      return {
                        emoji: currentR.emoji,
                        count: currentR.count,
                        reactedByMe: prevMatch?.reactedByMe ?? false,
                      }
                    })

                    return {
                      ...message,
                      reactions: merged,
                    }
                  },
                ),
              }))

              return { ...old, pages }
            },
          )
          return
        }

        /**
         * message:replies:increment
         * Adjust the repliesCount for a message by a delta (+1/-1).
         * Ensures repliesCount never falls below 0.
         */
        if (event.type === "message:replies:increment") {
          const { messageId, delta } = event.payload

          queryClient.setQueryData<RealtimeInfiniteMessages>(
            ["message.list", channelId],
            (old) => {
              if (!old) return old

              const pages = old.pages.map((page) => ({
                ...page,
                items: page.items.map((message) =>
                  message.id === messageId
                    ? {
                        ...message, //preseve all message properties and only update replyCount
                        repliesCount: Math.max(
                          0,
                          Number(message.repliesCount ?? 0) + Number(delta),
                        ),
                      }
                    : message,
                ),
              }))

              return { ...old, pages }
            },
          )
          return
        }
      } catch (error) {
        console.error("Something went wrong", error)
      }
    },
  })

  //memoized to prevent un-necessary re-renders
  const value = useMemo<ChannelRealtimeContextValueType>(() => {
    return {
      send: (event) => {
        // Serialize the event and send to the server over the WebSocket.
        socket.send(JSON.stringify(event))
      },
    }
  }, [socket])

  return (
    <ChannelRealtimeContext.Provider value={value}>
      {children}
    </ChannelRealtimeContext.Provider>
  )
}

/** custom hook where children comps can access the websocket send function to send messages*/
export function useChannelRealtime(): ChannelRealtimeContextValueType {
  const context = useContext(ChannelRealtimeContext)
  if (!context) {
    throw new Error(
      "useChannelRealtime must be used within a ChannelRealtimeProvider",
    )
  }

  return context
}
