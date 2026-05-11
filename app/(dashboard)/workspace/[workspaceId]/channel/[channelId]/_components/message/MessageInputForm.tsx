"use client"

import { createMessageSchema } from "@/app/schemas/message"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { useRequiredActiveWorkspace } from "@/hooks/use-active-workspace"
import { useAttachmentUpload } from "@/hooks/use-attachment-upload"
import { orpc } from "@/lib/orpc/orpc"
import { InfiniteMessages, MessageListItem, MessagePage } from "@/lib/types"
import { getAvatar } from "@/lib/utlis/get-avatar"
import { useChannelRealtime } from "@/providers/ChannelRealtimeProvider"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"
import MessageComposer from "./MessageComposer"

interface MessageInputFormProps {
  channelId: string
}

// type MessagePage = {
//   items: Message[]
//   nextCursor?: string
// }

// type InfiniteMessages = InfiniteData<MessagePage>

const MessageInputForm = ({ channelId }: MessageInputFormProps) => {
  const queryClient = useQueryClient()
  const [editorKey, setEditorKey] = useState(0)
  const upload = useAttachmentUpload()
  const { send } = useChannelRealtime()
  const { user } = useRequiredActiveWorkspace()

  const form = useForm({
    resolver: zodResolver(createMessageSchema),
    defaultValues: {
      channelId,
      content: "",
    },
  })

  const createMessageMutation = useMutation(
    orpc.message.create.mutationOptions({
      /**
       * onMutate runs before the mutation function executes on the server.
       * Use it to apply optimistic updates to the cache.
       */
      onMutate: async (_variables) => {
        /**
         * Prevent race conditions where an in-flight refetch overwrites our optimistic insert.
         */
        await queryClient.cancelQueries({
          queryKey: ["message.list", channelId],
        })

        /**
         * Snapshot the current cache state to allow rollback if the mutation fails.
         */
        const previousData = queryClient.getQueryData([
          "message.list",
          channelId,
        ])

        /**
         * Create a temporary client-only ID so we can later replace this optimistic record
         * with the server-confirmed record on success.
         */
        const tempId = `optimistic-${crypto.randomUUID()}`

        /**
         * Optimistic message mirrors the server Message shape so the UI can render immediately.
         */
        const optimisticMessage: MessageListItem = {
          id: tempId,
          threadId: null,
          content: _variables.content,
          imageUrl: _variables.imageUrl ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId: user.id,
          authorName: user.given_name ?? "John Doe",
          authorEmail: user.email!,
          authorAvatar: getAvatar(user.picture, user.email!),
          channelId,
          repliesCount: 0, // new messages start with no replies
          reactions: [], // new messages start with no reactions
        }

        /**
         * Apply an optimistic insert into the infinite list cache.
         * Assumption: pages[0] contains the newest messages (server sorts desc).
         */
        queryClient.setQueryData<InfiniteMessages>(
          ["message.list", channelId],
          (old) => {
            /**
             * If the infinite query has not been initialized in the cache yet,
             * bootstrap minimal cache so the optimistic message can render.
             */
            if (!old) {
              return {
                pages: [
                  {
                    items: [optimisticMessage],
                    nextCursor: undefined, //no more pages to fetch as this is only message in inital page
                  },
                ],
                pageParams: [undefined], //tracks pagination parameter for each page
                // undefined means intial page has no cursor
              } satisfies InfiniteMessages //for Typesript types
            }

            /**
             * Insert the optimistic message at the front of the newest page.
             * Remaining pages are preserved.
             */
            const firstPage = old.pages[0] ?? {
              items: [],
              nextCursor: undefined,
            }
            const updatedFirstPage: MessagePage = {
              ...firstPage,
              items: [optimisticMessage, ...firstPage.items],
            }

            return {
              ...old,
              pages: [updatedFirstPage, ...old.pages.slice(1)],
            }
          },
        )

        //Return context for onSuccess/onError.
        return {
          previousData,
          tempId,
        }
      },

      /**
       * onSuccess runs after the server confirms the message was created.
       * Replace the optimistic record with the authoritative server record.
       */
      onSuccess: (data, _variables, context) => {
        //data is data returned by server after successfully creating a message in database

        //update the cache with real message genereated by server
        queryClient.setQueryData<InfiniteMessages>(
          ["message.list", channelId],
          (old) => {
            if (!old || !context?.tempId) return old

            const updatedPages = old.pages.map((page) => ({
              ...page, //preserving next cursor and overwriting items
              items: page.items.map((m) =>
                /*message.id matches with optimistic temp message.id
                //update that optimistic message with new successfully added message from server
                //and remaininng messages in items array should remain same*/
                m.id === context.tempId ? { ...data } : m,
              ),
            }))

            // ...old: preserving page params and overwriting pages
            return { ...old, pages: updatedPages }
          },
        )

        form.reset({ channelId, content: "" })
        upload.clear()
        setEditorKey((k) => k + 1)
        send({ type: "message:created", payload: { message: data } })
        return toast.success("Message created successfully")
      },

      /**
       * onError runs if the mutation fails.
       * Roll back to the pre-mutation cache snapshot.
       */
      onError: (_err, _variables, context) => {
        if (context?.previousData) {
          queryClient.setQueryData(
            ["message.list", channelId],
            context.previousData,
          )
        }
        return toast.error("Something went wrong")
      },
    }),
  )

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
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}

export default MessageInputForm
