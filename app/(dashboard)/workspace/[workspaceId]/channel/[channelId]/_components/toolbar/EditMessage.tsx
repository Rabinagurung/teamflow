import { updateMessageSchema } from "@/app/schemas/message"
import RichTextEditor from "@/components/rich-text-editor/Editor"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Message } from "@/lib/generated/prisma/client"
import { orpc } from "@/lib/orpc/orpc"
import { useChannelRealtime } from "@/providers/ChannelRealtimeProvider"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"

interface EditMessage {
  message: Message
  onCancel: () => void
  onSave: () => void
}

type MessagePage = {
  items: Message[]
  nextCursor?: string
}

type InfiniteMessages = InfiniteData<MessagePage>

const EditMessage = ({ message, onCancel, onSave }: EditMessage) => {
  const queryClient = useQueryClient()
  const { send } = useChannelRealtime()
  const form = useForm({
    resolver: zodResolver(updateMessageSchema),
    defaultValues: {
      messageId: message.id,
      content: message.content,
    },
  })

  const updateMessageMutation = useMutation(
    orpc.message.update.mutationOptions({
      onSuccess: (updatedData) => {
        //surgically updating data through cache instead of invalidating the message
        queryClient.setQueryData<InfiniteMessages>(
          ["message.list", message.channelId],
          (old) => {
            if (!old) return old

            const updatedMessage = updatedData.message

            const pages = old.pages.map((page) => ({
              ...page, //preserve nextCursor and only update items array
              items: page.items.map((message) =>
                message.id === updatedMessage.id
                  ? { ...message, ...updatedMessage } //spreading old & updated message? properites are overwritten & preserve the fields that might not be in server response
                  : message,
              ),
            }))

            return { ...old, pages }
          },
        )

        toast.success("Message updated successfully")
        send({
          type: "message:updated",
          payload: { message: updatedData.message },
        })
        onSave()
      },

      onError: (error) => {
        toast.error(error.message || "Failed to update message")
      },
    }),
  )

  function onSubmit(data: z.infer<typeof updateMessageSchema>) {
    updateMessageMutation.mutate(data)
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
                <RichTextEditor
                  field={field}
                  sendButton={
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={onCancel}
                        disabled={updateMessageMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        disabled={updateMessageMutation.isPending}
                        type="submit"
                        size="sm"
                      >
                        {updateMessageMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  }
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

export default EditMessage
