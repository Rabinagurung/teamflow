import { z } from "zod"

function extractTextFromRichNode(node: unknown): string {
  if (!node || typeof node !== "object") {
    return ""
  }

  const value = node as {
    text?: unknown
    content?: unknown
  }

  const currentText = typeof value.text === "string" ? value.text : ""

  const childText = Array.isArray(value.content)
    ? value.content.map(extractTextFromRichNode).join("")
    : ""

  return currentText + childText
}

function getPlainTextFromStoredContent(content: string): string {
  const trimmed = content.trim()

  if (!trimmed) {
    return ""
  }

  try {
    const parsed = JSON.parse(trimmed)
    return extractTextFromRichNode(parsed).trim()
  } catch {
    return trimmed
  }
}

export const createMessageSchema = z
  .object({
    channelId: z.string(),
    content: z.string(),
    imageUrl: z.url().optional(),
    threadId: z.string().optional(),
  })
  .superRefine((input, ctx) => {
    const plainText = getPlainTextFromStoredContent(input.content)
    const hasText = plainText.length > 0
    const hasImage = Boolean(input.imageUrl)

    if (!hasText && !hasImage) {
      ctx.addIssue({
        code: "custom",
        path: ["content"],
        message: "Message must include text or an image.",
      })
    }
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
