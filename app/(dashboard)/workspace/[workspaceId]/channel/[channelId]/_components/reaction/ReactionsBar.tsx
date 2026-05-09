"use client"

import EmojiReaction from "./EmojiReaction"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { orpc } from "@/lib/orpc/orpc"
import { toast } from "sonner"
import { z } from "zod"
import { GroupedReactionSchema } from "@/app/schemas/message"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utlis/utils"
import { useParams } from "next/navigation"
import { InfiniteMessages } from "@/lib/types"
import { useChannelRealtime } from "@/providers/ChannelRealtimeProvider"
import { useOptionalThreadRealtime } from "@/providers/ThreadRealtimeProvider"

type ThreadContext = { type: "thread"; threadId: string }
type ListContext = { type: "list"; channelId: string }

interface ReactionBarProps {
  messageId: string
  reactions: z.infer<typeof GroupedReactionSchema>[]
  context?: ThreadContext | ListContext
}

const ReactionsBar = ({ messageId, reactions, context }: ReactionBarProps) => {
  const queryClient = useQueryClient()
  const { send } = useChannelRealtime()
  const threadRealtime = useOptionalThreadRealtime()

  const { channelId } = useParams<{ channelId: string }>()

  const toggleMutation = useMutation(
    orpc.message.reaction.toggle.mutationOptions({
      onMutate: async (vars: { messageId: string; emoji: string }) => {
        const bump = (
          currentReactions: z.infer<typeof GroupedReactionSchema>[],
        ) => {
          const existingReaction = currentReactions.find(
            (r) => r.emoji === vars.emoji,
          )

          // If the user already reacted with this emoji → remove the user's reaction
          if (existingReaction?.reactedByMe) {
            const newCount = existingReaction.count - 1

            // If no users remain for this emoji, remove the emoji entry entirely
            if (newCount <= 0) {
              return currentReactions.filter((r) => r.emoji !== vars.emoji)
            }

            // Otherwise decrement the count and mark reactedByMe as false for the user
            return currentReactions.map((r) =>
              r.emoji === vars.emoji
                ? { ...r, count: newCount, reactedByMe: false }
                : r,
            )
          }

          // If the user has not reacted with this emoji yet → add the user's reaction
          if (existingReaction) {
            // Emoji exists from other users, increment count and mark reactedByMe as true
            return currentReactions.map((r) =>
              r.emoji === vars.emoji
                ? { ...r, count: r.count + 1, reactedByMe: true }
                : r,
            )
          }

          // Emoji does not exist yet, create a new entry for the user's reaction
          return [
            ...currentReactions,
            { emoji: vars.emoji, count: 1, reactedByMe: true },
          ]
        }

        //Reactions to thread list
        const isThread = context && context.type === "thread"

        if (isThread) {
          // get us query key generateed by ORPC
          const listOptions = orpc.message.thread.list.queryOptions({
            input: { messageId: context.threadId },
          })

          //cancelQueries to prevent race conditions
          await queryClient.cancelQueries({ queryKey: listOptions.queryKey })

          //create a snapshot
          const previousThread = queryClient.getQueryData(listOptions.queryKey)

          queryClient.setQueryData(listOptions.queryKey, (old) => {
            if (!old) return old

            //reacting to parent message then update the reaction
            if (context.threadId === vars.messageId) {
              return {
                ...old, //preserve old.messages (thread replies)
                parent: {
                  ...old.parent,
                  reactions: bump(old.parent.reactions),
                },
              }
            }

            //reacting to thread reply
            return {
              ...old, //preserve old.parent(parent message)
              messages: old.messages.map((m) =>
                m.id === vars.messageId
                  ? { ...m, reactions: bump(m.reactions) }
                  : m,
              ),
            }
          })

          return {
            previousThread,
            threadQueryKey: listOptions.queryKey,
          }
        }

        //Reactions to message List
        const listKey = ["message.list", channelId]
        await queryClient.cancelQueries({ queryKey: listKey })

        const previous = queryClient.getQueryData(listKey)

        queryClient.setQueryData<InfiniteMessages>(listKey, (old) => {
          if (!old) return old

          const pages = old.pages.map((page) => ({
            ...page,
            items: page.items.map((message) => {
              if (message.id !== messageId) return message

              return {
                ...message,
                reactions: bump(message.reactions),
              }
            }),
          }))

          return { ...old, pages }
        })

        return {
          previous,
          listKey,
        }
      },

      onSuccess: (data) => {
        send({
          type: "reaction:updated",
          payload: {
            messageId: data.messageId,
            reactions: data.reactions.map((r) => ({
              emoji: r.emoji,
              count: r.count,
            })),
          },
        })

        if (context && context.type === "thread" && threadRealtime) {
          const threadId = context.threadId
          threadRealtime.send({
            type: "thread:reaction:updated",
            payload: {
              messageId: data.messageId,
              reactions: data.reactions.map((r) => ({
                emoji: r.emoji,
                count: r.count,
              })),
              threadId,
            },
          })
        }
        toast.success(`Emoji ${data.action}`)
      },

      onError: (_error, _variables, context) => {
        if (context?.previousThread && context.threadQueryKey) {
          queryClient.setQueryData(
            context.threadQueryKey,
            context.previousThread,
          )
        }

        if (context?.previous && context.listKey) {
          queryClient.setQueryData(context.listKey, context.previous)
        }
        toast.error("Emoji not added")
      },
    }),
  )

  const handleToggle = (emoji: string) => {
    toggleMutation.mutate({
      emoji,
      messageId,
    })
  }

  return (
    <div className="mt-1 flex items-center gap-1">
      {reactions?.map((reaction) => (
        <Button
          key={reaction.emoji}
          type="button"
          variant="secondary"
          className={cn(
            "h-6 px-2 text-xs",
            reaction.reactedByMe &&
              "bg-primary/10 dark:bg-primary/40 rounded-4xl border-primary border dark:border-none ",
          )}
          onClick={() => handleToggle(reaction.emoji)}
        >
          <span>{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </Button>
      ))}
      <EmojiReaction onSelect={handleToggle} />
    </div>
  )
}

export default ReactionsBar
