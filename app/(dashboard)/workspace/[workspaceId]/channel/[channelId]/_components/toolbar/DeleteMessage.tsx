import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { orpc } from "@/lib/orpc/orpc"
import { useThread } from "@/providers/ThreadProvider"
import { isDefinedError } from "@orpc/client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Trash } from "lucide-react"
import React, { useState } from "react"
import { toast } from "sonner"
import { useChannelRealtime } from "@/providers/ChannelRealtimeProvider"
import { InfiniteMessages } from "@/lib/types"
import { useRequiredActiveWorkspace } from "@/hooks/use-active-workspace"
import { workspaceQueryKeys } from "@/lib/query/workspace-query-keys"

interface DeleteMessageProps {
  messageId: string
  channelId: string
}

const DeleteMessage = ({ messageId, channelId }: DeleteMessageProps) => {
  const queryClient = useQueryClient()
  const { selectedThreadId, closeThread } = useThread()
  const { send } = useChannelRealtime()
  const { workspaceId } = useRequiredActiveWorkspace()
  const [open, setOpen] = useState(false)

  const deleteMessageMutation = useMutation(
    orpc.message.delete.mutationOptions({
      onSuccess: (data) => {
        queryClient.setQueryData<InfiniteMessages>(
          workspaceQueryKeys.messageList(workspaceId, channelId),
          (old) => {
            if (!old) return old

            const pages = old.pages.map((page) => ({
              ...page,
              items: page.items.filter(
                (message) => message.id !== data.messageId,
              ),
            }))

            return { ...old, pages }
          },
        )

        if (selectedThreadId === messageId) {
          closeThread()
        }

        send({
          type: "message:deleted",
          payload: {
            messageId: data.messageId,
          },
        })

        toast.success("Message deleted")
        setOpen(false)
      },

      onError: (error) => {
        toast.error(
          isDefinedError(error) ? error.message : "Failed to delete message.",
        )
      },
    }),
  )

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (deleteMessageMutation.isPending) return
        setOpen(nextOpen)
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash className="size-4" />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent size="default" className="gap-5">
        <AlertDialogHeader className="place-items-start text-left">
          <AlertDialogTitle>Delete message</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this message? This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMessageMutation.isPending}>
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            variant="destructive"
            disabled={deleteMessageMutation.isPending}
            onClick={(event) => {
              event.preventDefault()
              deleteMessageMutation.mutate({ messageId, workspaceId })
            }}
          >
            {deleteMessageMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default DeleteMessage
