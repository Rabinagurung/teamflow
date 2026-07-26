import { z } from "zod"

export const createMessageSchema = z.object({
  channelId: z.string(),
  content: z.string().min(100),
  imageUrl: z.url().optional(),
  threadId: z.string().optional(),
})

export const updateMessageSchema = z.object({
  messageId: z.string(),
  content: z.string().min(1),
})

export const deleteMessageSchema = z.object({
  messageId: z.string(),
})

export const toggleReactionSchema = z.object({
  messageId: z.string(),
  emoji: z.string().min(1),
})

export const groupedReactionSchema = z.object({
  emoji: z.string(),
  count: z.number(),
  reactedByMe: z.boolean(),
})
