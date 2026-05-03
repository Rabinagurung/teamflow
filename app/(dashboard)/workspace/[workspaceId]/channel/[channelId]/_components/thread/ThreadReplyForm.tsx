"use client"

import { createMessageSchema } from "@/app/schemas/message"
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useParams } from "next/navigation"
import React, { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import MessageComposer from "../message/MessageComposer"
import { useAttachmentUpload } from "@/hooks/use-attachment-upload"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { orpc } from "@/lib/orpc/orpc"
import { toast } from "sonner"
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs"
import { getAvatar } from "@/lib/utils/get-avatar"
import { InfiniteMessages, MessageListItem } from "@/lib/types"
import { useChannelRealtime } from "@/providers/ChannelRealtimeProvider"
import { useThreadRealtime } from "@/providers/ThreadRealtimeProvider"

interface ThreadReplyFormProps {
  threadId: string
  user: KindeUser<Record<string, unknown>>
}

const ThreadReplyForm = ({ threadId, user }: ThreadReplyFormProps) => {
  const queryClient = useQueryClient()
  const { channelId } = useParams<{ channelId: string }>()
  const { send } = useChannelRealtime()
  const { send: sendThread } = useThreadRealtime()
  const upload = useAttachmentUpload()
  const [editorKey, setEditorKey] = useState(0)

  const form = useForm({
    resolver: zodResolver(createMessageSchema),
    defaultValues: {
      content: "",
      channelId,
      threadId,
    },
  })

  /**
   * Implementation note:
   * `useForm` initializes `defaultValues` only once on mount.
   * Subsequent updates to `threadId` do not propagate to the form state because
   * the form instance persists across re-renders.
   *
   * This effect ensures the form state remains consistent with the current thread.
   */
  useEffect(() => {
    form.setValue("threadId", threadId)
    form.setValue("channelId", channelId)
  }, [threadId, form, channelId])

  const createMessageMutation = useMutation(
    orpc.message.create.mutationOptions({
      onMutate: async (data) => {
        const listOptions = orpc.message.thread.list.queryOptions({
          input: {
            messageId: threadId,
          },
        })

        await queryClient.cancelQueries({ queryKey: listOptions.queryKey })

        //Snapshot of data used to rollback if sever throws error while creating a message reply
        const previous = queryClient.getQueryData(listOptions.queryKey)

        const previousMainList = queryClient.getQueryData([
          "message.list",
          channelId,
        ])

        const optimisticReply: MessageListItem = {
          id: `optimistic:${crypto.randomUUID()}`,
          threadId: data.threadId!,
          channelId: data.channelId,
          content: data.content,
          imageUrl: data.imageUrl ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: user.id,
          authorEmail: user.email!,
          authorName: user.given_name ?? "John Doe",
          authorAvatar: getAvatar(user.picture, user.email!),
          repliesCount: 0, //no replies count for initial reply
          reactions: [], //no reactions for initial reply
        }

        queryClient.setQueryData(listOptions.queryKey, (old) => {
          if (!old) return old
          //preserve parent and in messages array: preserve old replies and add new optimisticReply
          return { ...old, messages: [...old.messages, optimisticReply] }
        })

        const listKey = ["message.list", channelId]
        //Optimistically bump reliesCount in main messaege list for the parent message
        queryClient.setQueryData<InfiniteMessages>(listKey, (old) => {
          if (!old) return old

          const pages = old.pages.map((page) => ({
            ...page,
            items: page.items.map((message) =>
              message.id === threadId
                ? { ...message, repliesCount: message.repliesCount + 1 }
                : message,
            ),
          }))

          return {
            ...old,
            pages,
          }
        })

        return {
          listOptions,
          previous,
          listKey,
          previousMainList,
        }
      },
      onSuccess: (data, _vars, context) => {
        //don't need to surgically update the replies because it will not be a big set of data like messages that required surgical cache update
        //we can just invalidateQueries
        queryClient.invalidateQueries({
          queryKey: context.listOptions.queryKey,
        })
        form.reset({ channelId, content: "", threadId })
        upload.clear()
        setEditorKey((k) => k + 1)

        sendThread({ type: "thread:reply:created", payload: { reply: data } })

        send({
          type: "message:replies:increment",
          payload: { messageId: threadId, delta: 1 },
        })

        toast.success("Reply posted successfully")
      },
      onError: (_error, _variables, context) => {
        if (context?.previous && context.listOptions) {
          queryClient.setQueryData(
            context.listOptions.queryKey,
            context.previous,
          )
        }

        if (context?.previousMainList) {
          queryClient.setQueryData(context.listKey, context.previousMainList)
        }

        toast.error("Something went wrong while posting reply")
      },
    }),
  )

  // view cannot work without a channelId, fail fast (or render disabled UI)
  if (!channelId) {
    return null
  }

  function onSubmit(data: z.infer<typeof createMessageSchema>) {
    createMessageMutation.mutate({
      ...data,
      imageUrl: upload.stagedUrl ?? undefined,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <MessageComposer
                  key={editorKey}
                  value={field.value}
                  onChange={field.onChange}
                  onSubmit={() => onSubmit(form.getValues())}
                  isSubmitting={createMessageMutation.isPending}
                  upload={upload}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}

export default ThreadReplyForm
