import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utlis/utils"
import { useThread } from "@/providers/ThreadProvider"
import { MessageSquareText, Pencil } from "lucide-react"
import DeleteMessage from "./DeleteMessage"

interface MessageHoverToolbarProps {
  messageId: string
  channelId: string
  canEdit: boolean
  isMobileOpen: boolean
  onEdit: () => void
  onAction?: () => void
}

export function MessageHoverToolbar({
  channelId,
  messageId,
  canEdit,
  isMobileOpen,
  onEdit,
  onAction,
}: MessageHoverToolbarProps) {
  const { toggleThread } = useThread()

  return (
    <div
      className={cn(
        "absolute right-2 top-2 z-10 shrink-0 flex-col items-center gap-0.5 rounded-md border border-gray-200",
        "bg-white/95 p-1 shadow-sm backdrop-blur transition-opacity dark:border-neutral-800 dark:bg-neutral-900/90",
        isMobileOpen ? "flex opacity-100" : "hidden opacity-0",
        "sm:-top-3 sm:flex sm:flex-row sm:gap-1 sm:px-1.5 sm:py-1",
        "sm:pointer-events-none sm:opacity-0 sm:group-hover:pointer-events-auto sm:group-hover:opacity-100",
        "sm:group-focus-within:pointer-events-auto sm:group-focus-within:opacity-100",
      )}
      onClick={(event) => event.stopPropagation()}
    >
      {canEdit && (
        <>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Edit message"
            className="size-8 sm:size-9"
            onClick={onEdit}
          >
            <Pencil className="size-3.5 sm:size-4" />
          </Button>
          <DeleteMessage
            messageId={messageId}
            channelId={channelId}
            buttonClassName="size-8 sm:size-9"
            iconClassName="size-3.5 sm:size-4"
          />
        </>
      )}

      <Button
        variant="ghost"
        size="icon"
        aria-label="Open thread"
        className="size-8 sm:size-9"
        onClick={() => {
          toggleThread(messageId)
          onAction?.()
        }}
      >
        <MessageSquareText className="size-3.5 sm:size-4" />
      </Button>
    </div>
  )
}
