import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Sparkles } from "lucide-react"
import React, { useState } from "react"
import { useChat } from "@ai-sdk/react"
import { eventIteratorToStream } from "@orpc/server"
import { client } from "@/lib/orpc/orpc"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"

interface SummarizeThreadProps {
  messageId: string
  workspaceId: string
}

const SummarizeThread = ({ messageId, workspaceId }: SummarizeThreadProps) => {
  const [open, setOpen] = useState(false)
  const {
    messages,
    status,
    error,
    sendMessage,
    clearError,
    setMessages,
    stop,
  } = useChat({
    id: `thread-summary:${messageId}`,
    transport: {
      async sendMessages(options) {
        return eventIteratorToStream(
          //standard client that works with orpc functiona, apis.
          //orpc client is used for tanstack query
          await client.ai.thread.summary.generate(
            {
              messageId: messageId,
              workspaceId,
            },
            { signal: options.abortSignal },
          ),
        )
      },
      reconnectToStream() {
        throw new Error("Unsupported")
      },
    },
  })

  //find's AI response so role has to assistant

  const lastAssistant = messages.findLast((m) => m.role === "assistant")

  //filter out all non-text parts from
  const summaryText =
    lastAssistant?.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("\n\n") ?? ""

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    //pop-over is open then call the AI model using sendMessage
    if (nextOpen) {
      const hasAssistantMessage = messages.some((m) => m.role === "assistant")

      //checks if we have assistant message and another request is in progress?
      if (status !== "ready" || hasAssistantMessage) {
        return
      }

      sendMessage({ text: "Summarize thread" })
    } else {
      stop()
      clearError()
      setMessages([])
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="sm"
          className="relative overflow-hidden rounded-full bg-gradient-to-t from-violet-600 to-fuchsia-600 
          shadow-md hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-3.5" />
            <span className="text-xs font-medium">Summarize</span>
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[25rem] p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <span
              className="relative inline-flex items-center justify-center rounded-full
            bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-1.5 gap-1.5"
            >
              <Sparkles className="size-3.5 text-white" />
              <span className="text-xs font-medium">Ai Summary (Preview)</span>
            </span>
          </div>
          {status === "streaming" && (
            <Button
              onClick={() => stop()}
              type="button"
              size="sm"
              variant="outline"
            >
              Stop
            </Button>
          )}
        </div>
        {/* Main content */}
        <div className="px-4 py-3 max-h-80 overflow-y-auto">
          {error ? (
            <div>
              <p className="text-red-500">{error.message}</p>
              <Button
                type="button"
                size="sm"
                className=""
                onClick={() => {
                  clearError()
                  setMessages([])
                  sendMessage({ text: "Summarize text" })
                }}
              >
                Try again
              </Button>
            </div>
          ) : summaryText ? (
            <Message from="assistant">
              <MessageContent>
                <MessageResponse>{summaryText}</MessageResponse>
              </MessageContent>
            </Message>
          ) : status === "submitted" || status === "streaming" ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground ">
              Click summarize to generate
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default SummarizeThread
