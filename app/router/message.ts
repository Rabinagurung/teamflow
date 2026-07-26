import prisma from "@/lib/db"
import { Message } from "@/lib/generated/prisma/client"
import { MessageListItem } from "@/lib/types"
import { getAvatar } from "@/lib/utlis/get-avatar"
import { z } from "zod"
import { readSecurityMiddleware } from "../middlewares/arcjet/read"
import { standardSecurityMiddleware } from "../middlewares/arcjet/standard"
import { writeSecurityMiddleware } from "../middlewares/arcjet/write"
import { requiredAuthMiddleware } from "../middlewares/auth"
import { base } from "../middlewares/base"
import { requiredWorkspaceMiddleware } from "../middlewares/workspace"
import {
  createMessageSchema,
  deleteMessageSchema,
  groupedReactionSchema,
  toggleReactionSchema,
  updateMessageSchema,
} from "../schemas/message"

type Reaction = {
  emoji: string
  userId: string
}

type Reactions = Reaction[]

function groupReactions(
  reactions: Reactions,
  userId: string,
): z.infer<typeof groupedReactionSchema>[] {
  const reactionMap = new Map<string, { count: number; reactedByMe: boolean }>()

  for (const reaction of reactions) {
    const existing = reactionMap.get(reaction.emoji)
    if (existing) {
      existing.count++
      if (reaction.userId === userId) {
        existing.reactedByMe = true
      }
    } else {
      reactionMap.set(reaction.emoji, {
        count: 1,
        reactedByMe: reaction.userId === userId,
      })
    }
  }

  return Array.from(reactionMap.entries()).map(([emoji, data]) => ({
    emoji,
    count: data.count,
    reactedByMe: data.reactedByMe,
  }))
}

export const createMessage = base
  .use(requiredAuthMiddleware)
  .use(requiredWorkspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .route({
    method: "POST",
    path: "/messages",
    summary: "Create a message",
    tags: ["Messages"],
  })
  .input(createMessageSchema)
  .output(z.custom<MessageListItem>())
  .handler(async ({ context, errors, input }) => {
    //verfiy channel belongs to user's org
    const channel = await prisma.channel.findFirst({
      where: {
        id: input.channelId,
        organizationId: context.workspace.id,
      },
    })

    if (!channel) {
      throw errors.FORBIDDEN()
    }

    //If this is a thread reply, validate the parent message
    if (input.threadId) {
      const parentMessage = await prisma.message.findFirst({
        where: {
          id: input.threadId,
          channel: {
            organizationId: context.workspace.id,
          },
        },
      })

      if (
        !parentMessage ||
        parentMessage.channelId !== input.channelId ||
        parentMessage.threadId !== null
      ) {
        throw errors.BAD_REQUEST()
      }
    }

    const created = await prisma.message.create({
      data: {
        content: input.content,
        imageUrl: input.imageUrl,
        channelId: input.channelId,
        authorId: context.user.id,
        authorEmail: context.user.email!,
        authorName: context.user.name ?? "John Doe",
        authorAvatar: getAvatar(
          context.user.image,
          context.user.name ?? context.user.email!,
        ),
        threadId: input.threadId, //threadId: undefined(parent message) , //threadId: defined(thread reply to a parent message)
      },
    })

    return { ...created, repliesCount: 0, reactions: [] }
  })

export const listMessages = base
  .use(requiredAuthMiddleware)
  .use(requiredWorkspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .route({
    method: "GET",
    path: "/messages",
    summary: "List all messages",
    tags: ["Messages"],
  })
  .input(
    z.object({
      channelId: z.string(),
      limit: z.number().min(1).max(100).optional(),
      cursor: z.string().optional(),
      //cursor: id of last message(unique identifier) from previous page
      //why cursor optional: first time page load -> cursor undefined -> if we scroll to top then cursor is defined
    }),
  )
  .output(
    z.object({
      items: z.array(z.custom<MessageListItem>()),
      nextCursor: z.string().optional(),
      /** when user scrolls to top, we have to know what next cursor is and 
      used as input for the next page*/
    }),
  )
  .handler(async ({ input, errors, context }) => {
    //verify channel belongs to user's organization(authorize)
    const channel = await prisma.channel.findFirst({
      where: {
        id: input.channelId,
        organizationId: context.workspace.id,
      },
    })

    if (!channel) {
      throw errors.FORBIDDEN()
    }

    const limit = input.limit ?? 30

    //get messages of specific channel of authorized user
    const messages = await prisma.message.findMany({
      where: {
        channelId: input.channelId,
        threadId: null, //only get parent message whose threadId = null (not thread replies)
      },
      ...(input.cursor
        ? {
            cursor: { id: input.cursor }, //cursor is defined then tells prisma to start from this specific message id
            skip: 1, // to skip this specific cursor(last message id) itself cause we dont need last message
          }
        : {
            //returning {}: it means cursor undefined - first page - no cursor property added query starts from beginning
          }),
      take: limit + 1, //get x amount of result
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      //created "desc": get new message first and if timestamps are identical then id is used as tie breaker
      include: {
        _count: { select: { replies: true } },
        reactions: {
          select: { emoji: true, userId: true },
        },
      },
    })

    const messageItems: MessageListItem[] = messages.map((m) => ({
      ...m,
      repliesCount: m._count.replies,
      reactions: groupReactions(
        (m.reactions ?? []).map((reaction) => ({
          emoji: reaction.emoji,
          userId: reaction.userId,
        })),
        context.user.id,
      ),
    }))

    let nextCursor: string | undefined
    let data = messageItems

    //31 > 30
    if (messageItems.length > limit) {
      //slice(0, 30) = data = [1, 30] (remove the last item with index 30 which is 31 in array)
      data = messageItems.slice(0, limit)
      //now data = [1,..,30] = get id of last message of index 29
      nextCursor = data[data.length - 1].id
    }

    return {
      items: data,
      nextCursor,
    }
  })

export const updateMessage = base
  .use(requiredAuthMiddleware)
  .use(requiredWorkspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .route({
    method: "PUT",
    path: "/messages/:messageId",
    summary: "Edit message",
    tags: ["Messages"],
  })
  .input(updateMessageSchema)
  .output(
    z.object({
      message: z.custom<Message>(),
      canEdit: z.boolean(),
    }),
  )
  .handler(async ({ context, errors, input }) => {
    const message = await prisma.message.findFirst({
      where: {
        id: input.messageId,
        channel: {
          organizationId: context.workspace.id,
        },
      },
      select: {
        id: true,
        authorId: true,
      },
    })

    if (!message) {
      throw errors.FORBIDDEN()
    }

    if (message.authorId !== context.user.id) {
      throw errors.FORBIDDEN()
    }

    const updated = await prisma.message.update({
      where: {
        id: input.messageId,
      },
      data: {
        content: input.content,
      },
    })

    return {
      message: updated,
      canEdit: updated.authorId === context.user.id,
    }
  })

export const deleteMessage = base
  .use(requiredAuthMiddleware)
  .use(requiredWorkspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .route({
    method: "DELETE",
    path: "/messages/:messageId",
    summary: "Delete Message",
    tags: ["Messages"],
  })
  .input(deleteMessageSchema)
  .output(
    z.object({
      messageId: z.string(),
      deleted: z.boolean(),
      threadId: z.string().nullable(),
    }),
  )
  .handler(async ({ context, errors, input }) => {
    const message = await prisma.message.findFirst({
      where: {
        id: input.messageId,
        channel: {
          organizationId: context.workspace.id,
        },
      },
      select: {
        id: true,
        authorId: true,
        threadId: true,
      },
    })

    if (!message) {
      throw errors.NOT_FOUND({
        message: "Message not found",
      })
    }

    if (message.authorId !== context.user.id) {
      throw errors.FORBIDDEN({
        message: "You do not have permission to delete this message",
      })
    }

    await prisma.message.delete({
      where: {
        id: input.messageId,
      },
    })

    return {
      messageId: message.id,
      deleted: true,
      threadId: message.threadId,
    }
  })

export const listThreadReplies = base
  .use(requiredAuthMiddleware)
  .use(requiredWorkspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .route({
    method: "GET",
    path: "/messages/:messageId/thread",
    summary: "List replies in a thread",
    tags: ["Messages"],
  })
  .input(
    z.object({
      messageId: z.string(),
    }),
  )
  .output(
    z.object({
      parent: z.custom<MessageListItem>(),
      messages: z.array(z.custom<MessageListItem>()),
    }),
  )
  .handler(async ({ context, errors, input }) => {
    //get parent message
    const parentRow = await prisma.message.findFirst({
      where: {
        id: input.messageId,
        channel: {
          organizationId: context.workspace.id,
        },
      },
      include: {
        _count: { select: { replies: true } },
        reactions: { select: { emoji: true, userId: true } },
      },
    })

    if (!parentRow) {
      throw errors.NOT_FOUND()
    }

    //Fetch messages with all thread replies
    const messagesQuery = await prisma.message.findMany({
      where: {
        threadId: input.messageId,
        channel: {
          organizationId: context.workspace.id,
        },
        // Optional (stronger): keep replies in the same channel as the parent
        channelId: parentRow.channelId,
      },
      include: {
        _count: { select: { replies: true } },
        reactions: { select: { emoji: true, userId: true } },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    })

    const parent: MessageListItem = {
      ...parentRow,
      repliesCount: parentRow._count.replies,
      reactions: groupReactions(
        parentRow.reactions.map((reaction) => ({
          emoji: reaction.emoji,
          userId: reaction.userId,
        })),
        context.user.id,
      ),
    }

    const messages: MessageListItem[] = messagesQuery.map((message) => ({
      ...message,
      repliesCount: message._count.replies,
      reactions: groupReactions(
        message.reactions.map((reaction) => ({
          emoji: reaction.emoji,
          userId: reaction.userId,
        })),
        context.user.id,
      ),
    }))

    return {
      parent,
      messages,
    }
  })

//iF REACTION already exists, we delete it or does not exists, add it.
export const toggleReaction = base
  .use(requiredAuthMiddleware)
  .use(requiredWorkspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .route({
    method: "POST",
    path: "/messages/:messageId/reactions",
    summary: "Toggle a reaction",
    tags: ["Messages"],
  })
  .input(toggleReactionSchema)
  .output(
    z.object({
      messageId: z.string(),
      reactions: z.array(groupedReactionSchema),
      action: z.string(),
    }),
  )
  .handler(async ({ context, input, errors }) => {
    //verify message exists and belongs to user's workspace
    const message = await prisma.message.findFirst({
      where: {
        id: input.messageId,
        channel: {
          organizationId: context.workspace.id,
        },
      },
      select: { id: true },
    })

    if (!message) {
      throw errors.NOT_FOUND()
    }

    //add reaction to database
    const inserted = await prisma.messageReaction.createMany({
      data: [
        {
          emoji: input.emoji,
          messageId: input.messageId,
          userId: context.user.id,
          userName: context.user.name ?? "John Doe",
          userAvatar: getAvatar(
            context.user.image,
            context.user.name ?? context.user.email!,
          ),
          userEmail: context.user.email!,
        },
      ],

      //same user, same message and same reaction exisits ? skip reaction : create reaction
      skipDuplicates: true,
    })

    const action = inserted.count === 1 ? "added" : "removed"

    //inserted.count = 1: reaction created cox its unique reaction per user per message
    // inserted.count = 0: reaction already exists and its deleted
    if (inserted.count === 0) {
      await prisma.messageReaction.deleteMany({
        where: {
          messageId: input.messageId,
          userId: context.user.id,
          emoji: input.emoji,
        },
      })
    }

    //fetches message with all of its reaction
    const updated = await prisma.message.findUnique({
      where: {
        id: input.messageId,
      },
      include: {
        reactions: { select: { emoji: true, userId: true } },
        _count: { select: { replies: true } },
      },
    })

    if (!updated) {
      throw errors.NOT_FOUND()
    }

    return {
      messageId: updated.id,
      reactions: groupReactions(
        (updated.reactions ?? []).map((reaction) => ({
          emoji: reaction.emoji,
          userId: reaction.userId,
        })),
        context.user.id,
      ),

      action,
    }
  })
