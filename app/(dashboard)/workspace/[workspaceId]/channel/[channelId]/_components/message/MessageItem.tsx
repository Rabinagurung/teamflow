import SafeContent from "@/components/rich-text-editor/SafeContent"
import { getAvatar } from "@/lib/utils/get-avatar"
import Image from "next/image"
import { MessageHoverToolbar } from "../toolbar"
import { useCallback, useState } from "react"
import EditMessage from "../toolbar/EditMessage"
import { MessageListItem } from "@/lib/types"
import { MessagesSquare } from "lucide-react"
import { useThread } from "@/providers/ThreadProvider"
import { orpc } from "@/lib/orpc/orpc"
import { useQueryClient } from "@tanstack/react-query"
import ReactionsBar from "../reaction/ReactionsBar"

interface MessageItemProps {
  message: MessageListItem
  currentUserId: string
}

const MessageItem = ({ message, currentUserId }: MessageItemProps) => {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const { openThread } = useThread()

  const prefetchThread = useCallback(() => {
    const options = orpc.message.thread.list.queryOptions({
      input: {
        messageId: message.id,
      },
    })

    queryClient
      .prefetchQuery({
        ...options,
        staleTime: 60_000, //How long cache data stay fresh? 60 secs
      })
      .catch(() => {})
  }, [message.id, queryClient])

  return (
    <div className="group flex space-x-3 relative p-3 rounded-lg hover:bg-muted/50">
      <Image
        src={getAvatar(message.authorAvatar, message.authorEmail)}
        alt="User Avatar"
        width={32}
        height={32}
        className="size-8 rounded-lg"
      />
      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex items-center gap-x-2">
          <p className="font-medium leading-none">{message.authorName}</p>
          <p className="text-xs text-muted-foreground leading-none">
            {new Intl.DateTimeFormat("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }).format(message.createdAt)}{" "}
            {new Intl.DateTimeFormat("en-GB", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
            }).format(message.createdAt)}
          </p>
        </div>

        {isEditing ? (
          <EditMessage
            message={message}
            onCancel={() => setIsEditing(false)}
            onSave={() => setIsEditing(false)}
          />
        ) : (
          <>
            <SafeContent
              content={(() => {
                if (!message.content) return ""
                try {
                  return JSON.parse(message.content)
                } catch {
                  console.error("Failed to parse message content:", message.id)
                  return ""
                }
              })()}
              className="text-sm break-words prose dark:prose-invert max-w-none marker:text-primary"
            />

            {message.imageUrl && (
              <div className="mt-3">
                <Image
                  src={message.imageUrl}
                  alt="Message Attachment"
                  height={512}
                  width={512}
                  className="rounded-md max-h-80 w-auto object-contain"
                  unoptimized
                />
              </div>
            )}

            {/* Reactions */}

            {message.channelId && (
              <ReactionsBar
                messageId={message.id}
                reactions={message.reactions}
                context={{ type: "list", channelId: message.channelId }}
              />
            )}

            {message.repliesCount > 0 && (
              <button
                type="button"
                className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground 
                hover:text-foreground focus-visible:outline-none focus-visible:ring-1
                focus-visible:ring-border cursor-pointer"
                onClick={() => openThread(message.id)}
                onMouseEnter={prefetchThread}
                onFocus={prefetchThread}
              >
                <MessagesSquare className="size-3.5" />
                <span>
                  {message.repliesCount}
                  {message.repliesCount === 1 ? " reply" : " replies"}
                </span>
                <span className="opacity-0 group-hover:opacity-100">
                  View Thread
                </span>
              </button>
            )}
          </>
        )}
      </div>

      <MessageHoverToolbar
        messageId={message.id}
        canEdit={message.authorId === currentUserId}
        onEdit={() => setIsEditing(true)}
      />
    </div>
  )
}

export default MessageItem
