import { z } from "zod"
import { groupedReactionSchema } from "./message"

const PublicReactionSchema = z.object({
  emoji: z.string(),
  count: z.number(),
})

export const UserSchema = z.object({
  id: z.string(),
  full_name: z.string().nullable(),
  email: z.email(),
  picture: z.string().nullable(),
})

/**
 * PresenceMessageSchema
 *
 * This is your WebSocket protocol (client <-> server).
 * A message must be one of:
 *
 * 1) add-user:
 *    Client -> Server
 *    Associates this WebSocket connection with a user object.
 *
 * 2) remove-user:
 *    Client -> Server (optional in your current design)
 *    Clears the user association for this connection.
 *    Note: Your server also removes users naturally when sockets close.
 *
 * 3) presence:
 *    Server -> Client
 *    A snapshot of all currently-online unique users in the room.
 */
export const PresenceMessageSchema = z.union([
  z.object({
    type: z.literal("add-user"),
    payload: UserSchema,
  }),
  z.object({
    type: z.literal("remove-user"),
    payload: z.object({ id: z.string() }),
  }),
  z.object({
    type: z.literal("presence"),
    payload: z.object({
      users: z.array(UserSchema),
    }),
  }),
])

//Minimal message shape for realtime events
export const RealtimeMessageSchema = z.object({
  id: z.string(),
  content: z.string().optional().nullable(),
  imageUrl: z.url().optional().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  authorId: z.string(),
  authorName: z.string().optional().nullable(),
  authorEmail: z.string().optional().nullable(),
  authorAvatar: z.string().optional().nullable(),
  channelId: z.string().nullable(),
  threadId: z.string().optional().nullable(),
  reactions: z.array(groupedReactionSchema).optional(),
  repliesCount: z.number().optional(),
})

// Channel-level events
export const ChannelEventSchema = z.union([
  z.object({
    type: z.literal("message:created"),
    payload: z.object({ message: RealtimeMessageSchema }),
  }),
  z.object({
    type: z.literal("message:updated"),
    payload: z.object({ message: RealtimeMessageSchema }),
  }),
  z.object({
    type: z.literal("reaction:updated"),
    payload: z.object({
      messageId: z.string(),
      reactions: z.array(PublicReactionSchema),
    }),
  }),
  z.object({
    type: z.literal("message:replies:increment"),
    payload: z.object({ messageId: z.string(), delta: z.number() }),
  }),
])

//Thread-level events
export const ThreadEventSchema = z.union([
  z.object({
    type: z.literal("thread:reply:created"),
    payload: z.object({ reply: RealtimeMessageSchema }),
  }),
  z.object({
    type: z.literal("thread:reaction:updated"),
    payload: z.object({
      messageId: z.string(),
      reactions: z.array(PublicReactionSchema),
      threadId: z.string(),
    }),
  }),
])
