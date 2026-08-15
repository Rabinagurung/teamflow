import { InfiniteData } from "@tanstack/react-query"
import { Message } from "./generated/prisma/client"
import { z } from "zod"
import { groupedReactionSchema } from "@/app/schemas/message"

export type MessageListItem = Message & {
  repliesCount: number
  reactions: z.infer<typeof groupedReactionSchema>[]
}

export type MessagePage = {
  items: MessageListItem[]
  nextCursor?: string
}

export type InfiniteMessages = InfiniteData<MessagePage>

export type ThreadMessages = {
  parent: MessageListItem
  messages: MessageListItem[]
}
