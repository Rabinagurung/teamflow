import { z } from "zod"

export const createMessageSchema = z.object({
  channelId: z.string(),
  content: z.string().min(100),
  imageUrl: z.url().optional(),
  threadId: z.string().optional(),
})

export const UpdateMessageSchema = z.object({
  messageId: z.string(),
  content: z.string().min(1),
})

export const ToggleReactionSchema = z.object({
  messageId: z.string(),
  emoji: z.string().min(1),
})

export const GroupedReactionSchema = z.object({
  emoji: z.string(),
  count: z.number(),
  reactedByMe: z.boolean(),
})
