import { useState } from "react"
import usePartySocket from "partysocket/react"
import { z } from "zod"
import { PresenceMessageSchema, UserSchema } from "@/app/schemas/realtime"

/**
 * Props for the `usePresence` hook.
 *
 * This interface defines the inputs required to establish and manage a
 * realtime presence connection for a specific logical room.
 *
 * - `room` identifies the presence scope (for example, a workspace ID).
 *   Each distinct room value maps to a separate server-side presence instance.
 *
 * - `currentUser` represents the authenticated user for the current client
 *   session. When provided, the hook will automatically register the user
 *   with the presence server by sending an `"add-user"` message when the
 *   WebSocket connection opens.
 *
 * If `currentUser` is `null`, no user registration is performed until a
 * valid user object becomes available.
 */
interface usePresenceProps {
  room: string
  currentUser: z.infer<typeof UserSchema> | null
}

/**
 * usePresence
 *
 * Creates and manages a PartySocket WebSocket connection for presence in a given room.
 *
 * What it does:
 * - Connects to the server (PartyServer / Durable Object room) on mount.
 * - When the socket opens, sends "add-user" (if currentUser is available).
 * - Listens for "presence" snapshots from the server and updates React state.
 * - Disconnects automatically on unmount.
 *
 * Relationship to server lifecycle:
 * - Client `onOpen()` corresponds to the moment the WebSocket is open on the client.
 *   On the server, a corresponding connection triggers `Chat.onConnect(connection)`.
 * - Client `socket.send(...)` triggers server `Chat.onMessage(connection, message)`.
 * - Server `broadcast(...)` triggers client `onMessage(event)` on every connected client.
 */
export function usePresence({ room, currentUser }: usePresenceProps) {
  const [onlineUsers, setOnlineUsers] = useState<z.infer<typeof UserSchema>[]>(
    [],
  )

  const socket = usePartySocket({
    /**
     * host: where your Worker is reachable.
     * In local dev with wrangler, it is typically localhost:8787.
     * (Some setups accept http://localhost:8787, but the common form is without protocol.)
     */
    host: "localhost:8787",

    /** Room name/id: isolates the Durable Object instance (presence per workspace). */
    room,

    /**
     * party: selects which "party" (server name) to connect to.
     * This MUST match your server-side routing configuration used by routePartykitRequest.
     * You are using "chat" here; ensure your server routing expects that.
     */
    party: "chat",

    /**
     * onOpen runs when the socket becomes OPEN.
     * We register the current user by sending an "add-user" message to the server.
     */
    onOpen() {
      console.log("Connected to presence room: ", room)

      if (currentUser) {
        // Build a protocol message that matches PresenceMessageSchema.
        const message: z.infer<typeof PresenceMessageSchema> = {
          type: "add-user",
          payload: currentUser,
        }

        // WebSockets send strings or binary, not raw JS objects → JSON.stringif
        socket.send(JSON.stringify(message))
      }
    },

    /**
     * onMessage runs whenever this client receives a message from the server.
     *
     * In this app protocol, the server sends "presence" snapshots:
     * { type: "presence", payload: { users: User[] } }
     *
     * We parse JSON, validate with Zod, and update state.
     */
    onMessage(event) {
      try {
        const message = JSON.parse(event.data)

        const result = PresenceMessageSchema.safeParse(message)

        if (result.success && result.data?.type === "presence") {
          setOnlineUsers(result.data.payload.users)
        }
      } catch (error) {
        console.log("Failed to parse message", error)
      }
    },

    /**
     * onClose runs when the socket is closed (tab close/unmount/network drop/etc.).
     * The server-side counterpart is `Chat.onClose(connection)` for that socket.
     */
    onClose() {
      console.log("Disconnected from presence room", room)
    },

    /**
     * onError runs when the socket encounters an error.
     * Often an onClose follows afterward.
     */
    onError(error) {
      console.error("Web socket error: ", error)
    },
  })

  /**
   * Expose:
   * - onlineUsers: derived from server "presence" snapshots
   * - socket: raw PartySocket instance (for sending extra messages if needed)
   */
  return {
    onlineUsers,
    socket,
  }
}
