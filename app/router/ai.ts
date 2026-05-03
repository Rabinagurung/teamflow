import z from "zod"
import { requiredAuthMiddleware } from "../middlewares/auth"
import { base } from "../middlewares/base"
import { requiredWorkspaceMiddleware } from "../middlewares/workspace"
import prisma from "@/lib/db"
import { tipTapJsonToMarkdown } from "@/lib/utils/json-to-markdown"
import { streamText } from "ai"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { streamToEventIterator } from "@orpc/client"
import { aiSecurityMiddleware } from "../middlewares/arcjet/ai-middleware"

const LLM_KEY = process.env.LLM_KEY
if (!LLM_KEY) {
  console.warn(
    "LLM_KEY environment variable is not set. AI features will be unavailable.",
  )
}

const openrouter = createOpenRouter({
  apiKey: LLM_KEY,
})
const MODEL_ID = "z-ai/glm-4.5-air:free"

const model = openrouter.chat(MODEL_ID)

export const generateThreadSummary = base
  .use(requiredAuthMiddleware)
  .use(requiredWorkspaceMiddleware)
  .use(aiSecurityMiddleware)
  .route({
    method: "GET",
    path: "/ai/thread/summary",
    summary: "Generate thread summary",
    tags: ["Ai"],
  })
  .input(
    z.object({
      messageId: z.string(),
    }),
  )
  .handler(async ({ input, context, errors }) => {
    const baseMessage = await prisma.message.findFirst({
      where: {
        id: input.messageId,
        Channel: {
          workspaceId: context.workspace.orgCode,
        },
      },
      select: {
        id: true,
        threadId: true,
        channelId: true,
      },
    })

    if (!baseMessage) {
      throw errors.NOT_FOUND()
    }

    // If parent message id is passed then baseMessage.threadid will be null and we have baseMessage.id defined.
    // If reply message id is passed then baseMessage.threadId will be defined.
    // This makes sure we have correct parentId of a message(which can be parent message or reply message)
    const parentId = baseMessage.threadId ?? baseMessage.id

    //fetching data from parent message of message
    const parent = await prisma.message.findFirst({
      where: {
        id: parentId,
        Channel: {
          workspaceId: context.workspace.orgCode,
        },
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        authorName: true,
        replies: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            authorName: true,
          },
        },
      },
    })

    if (!parent) {
      throw errors.NOT_FOUND()
    }

    const replies = parent.replies.slice().reverse()

    //Convert rich text json string to markdown using helper function: json-to-markdown
    const parentText = await tipTapJsonToMarkdown(parent.content)

    //format thread into structured prompt and joined the array.
    const lines = []

    lines.push(
      `Thread Root- ${parent.authorName} - ${parent.createdAt.toISOString()}`,
    )

    lines.push(parentText)

    if (replies.length > 0) {
      lines.push("\n Replies:")
      for (const reply of replies) {
        const replyMarkdownContent = await tipTapJsonToMarkdown(reply.content)
        lines.push(
          `- ${reply.authorName} - ${reply.createdAt.toISOString()}: ${replyMarkdownContent}`,
        )
      }
    }

    //full structured string with parent message and replies
    const complied = lines.join("\n")

    const system = [
      "You are an expert assistant summarizing Slack-like discussion threads for a product team.",
      "Use only the provided thread content; do not invent facts, names, or timelines.",
      "Output format (Markdown):",
      "- First, write a single concise paragraph (2–4 sentences) that captures the thread's purpose, key decisions, context, and any blockers or next steps. No heading, no list, no intro text.",
      "- Then add a blank line followed by exactly 2–3 bullet points (using '-') with the most important takeaways. Each bullet is one sentence.",
      "Style: neutral, specific, and concise. Preserve terminology from the thread (names, acronyms). Avoid filler or meta-commentary. Do not add a closing sentence.",
      "If the context is insufficient, return a single-sentence summary and omit the bullet list.",
    ].join("\n")

    /** stream AI summary given by AI model back to client.
     * temperature: 0.2: lower temp more consistent summary becomes
     */
    const result = streamText({
      model,
      system,
      messages: [{ role: "user", content: complied }],
      temperature: 0.2,
    })

    //streamToEventIterator:
    return streamToEventIterator(result.toUIMessageStream())
  })

export const generateCompose = base
  .use(requiredAuthMiddleware)
  .use(requiredWorkspaceMiddleware)
  .use(aiSecurityMiddleware)
  .route({
    method: "POST",
    path: "/ai/compose/generate",
    summary: "Compose message",
    tags: ["AI"],
  })
  .input(
    z.object({
      content: z.string(),
    }),
  )
  .handler(async ({ input }) => {
    const markdownContent = await tipTapJsonToMarkdown(input.content)

    // Focused system prompt for deterministic rewrite (non-conversational)
    const system = [
      "You are an expert rewriting assistant. You are not a chatbot.",
      "Task: Rewrite the provided content to be clearer and better structured while preserving meaning, facts, terminology, and names.",
      "Do not address the user, ask questions, add greetings, or include commentary.",
      "Keep existing links/mentions intact. Do not change code blocks or inline code content.",
      "Output strictly in Markdown (paragraphs and optional bullet lists). Do not output any HTML or images.",
      "Return ONLY the rewritten content. No preamble, headings, or closing remarks.",
    ].join("\n")

    const result = streamText({
      model,
      system,
      messages: [
        {
          role: "user",
          content: `Please rewrite and improve the following content:\n\n${markdownContent}`,
        },
      ],
      temperature: 0,
    })

    //stream result to UI: result.toUIMessageStream()
    return streamToEventIterator(result.toUIMessageStream())
  })
