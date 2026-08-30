import SafeContent from "@/components/rich-text-editor/SafeContent"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"
import { MessageHoverToolbar } from "../toolbar"
import { type MouseEvent, useCallback, useState } from "react"
import EditMessage from "../toolbar/EditMessage"
import { MessageListItem } from "@/lib/types"
import { MessagesSquare } from "lucide-react"
import { useThread } from "@/providers/ThreadProvider"
import { orpc } from "@/lib/orpc/orpc"
import { useQueryClient } from "@tanstack/react-query"
import ReactionsBar from "../reaction/ReactionsBar"
import { getAvatar } from "@/lib/utlis/get-avatar"
import { cn } from "@/lib/utlis/utils"

interface MessageItemProps {
  message: MessageListItem
  currentUserId: string
  isToolbarOpen: boolean
  onToggleToolbar: () => void
  onCloseToolbar: () => void
}

const MessageItem = ({
  message,
  currentUserId,
  isToolbarOpen,
  onToggleToolbar,
  onCloseToolbar,
}: MessageItemProps) => {
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

  const authorInitial = message.authorName.trim().charAt(0).toUpperCase() || "?"

  const handleMessageClick = (event: MouseEvent<HTMLDivElement>) => {
    if (isEditing) return
    if (window.matchMedia("(min-width: 640px)").matches) return

    const target = event.target

    if (
      target instanceof HTMLElement &&
      target.closest(
        "a, button, input, textarea, select, [contenteditable='true'], [role='button']",
      )
    ) {
      return
    }

    onToggleToolbar()
  }

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 rounded-lg border-l-2 border-transparent px-3 py-2.5 transition-colors hover:border-primary/45 hover:bg-card/70",
        isToolbarOpen && "border-primary/45 bg-card/70",
      )}
      onClick={handleMessageClick}
    >
      <Avatar className="size-9 rounded-lg ring-1 ring-border">
        <AvatarImage
          src={getAvatar(message.authorAvatar, message.authorEmail!)}
          alt={`${message.authorName} avatar`}
        />
        <AvatarFallback className="rounded-lg bg-primary/10 text-sm font-semibold text-primary">
          {authorInitial}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className="font-semibold leading-none text-foreground">
            {message.authorName}
          </p>
          <p className="text-xs leading-none text-muted-foreground">
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
              content={message.content}
              className="prose max-w-none break-words text-sm text-foreground/90 marker:text-primary dark:prose-invert"
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
                onClick={(event) => {
                  event.stopPropagation()
                  openThread(message.id)
                  onCloseToolbar()
                }}
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
        channelId={message.channelId}
        messageId={message.id}
        canEdit={message.authorId === currentUserId}
        isMobileOpen={isToolbarOpen}
        onEdit={() => {
          setIsEditing(true)
          onCloseToolbar()
        }}
        onAction={onCloseToolbar}
      />
    </div>
  )
}

export default MessageItem
