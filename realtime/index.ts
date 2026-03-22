import {
  ChannelEventSchema,
  PresenceMessageSchema,
  ThreadEventSchema,
  UserSchema,
} from "@/app/schemas/realtime"
import { Connection, routePartykitRequest, Server } from "partyserver"
import { z } from "zod"

/**
 * Zod schema for per-connection state stored on the server.
 *
 * In PartyServer/PartyKit, each active WebSocket connection can have a small
 * ephemeral `connection.state`. This state:
 * - exists only while that connection is alive,
 * - is NOT Durable Object persistent storage,
 * - is useful for presence (who is connected / which user this socket belongs to).
 *
 * Here, we store (optionally) the authenticated/identified user for this socket.
 */
const ConnectionStateSchema = z
  .object({
    user: UserSchema.nullable().optional(),
  })
  .nullable()

type ConnectionState = z.infer<typeof ConnectionStateSchema>

/**
 * Chat is a PartyServer "Server" class (a wrapper around a Durable Object instance).
 *
 * Mental model:
 * - `Chat` is the Durable Object CLASS.
 * - Each "room" (workspaceId, etc.) becomes a distinct Durable Object INSTANCE.
 * - Each instance manages the set of WebSocket connections for that room.
 *
 *
 * This server supports two message categories over the same WebSocket:
 * 1) Presence protocol (add-user/remove-user/presence snapshots)
 * 2) Channel realtime events (message created/updated, reactions, reply count changes)
 */
export class Chat extends Server {
  /**
   * Enables WebSocket hibernation (where supported). This can reduce costs by
   * allowing inactive websocket connections to be hibernated.
   */
  static options = { hibernate: true }

  /**
   * Called when a new WebSocket connection successfully attaches to this room instance.
   *
   * @param connection - server-side handle for this client connection.
   *
   * What we do:
   * - log connection details,
   * - immediately send the current presence snapshot to this newly connected socket.
   *
   * Note: At this moment, the server does not yet know which "user" this socket represents
   * until the client sends an "add-user" message (unless you authenticate during connect).
   */
  onConnect(connection: Connection) {
    console.log("Connected", connection.id, "to server", this.name)

    // Send current presence snapshot to the newly connected client only.
    connection.send(JSON.stringify(this.getPresenceMessage()))
  }

  /**
   * Called when a WebSocket connection is closed.
   * Common reasons:
   * - user closes tab
   * - refreshes page
   * - network drops
   * - server-side close
   *
   * We recompute presence from currently active connections and broadcast it.
   * (We do not maintain a separate "online users list"; presence is derived from live connections.)
   */
  onClose(connection: Connection) {
    console.log(`User disconnected: ${connection.id}`)

    this.updateUsers()
  }

  /**
   * Called when a WebSocket connection errors.
   * Errors do not always mean the socket has fully disconnected yet, but it usually
   * indicates the connection is unhealthy and may close soon.
   *
   * We recompute and broadcast presence to keep clients consistent.
   */
  onError(connection: Connection) {
    console.log(`Connection error ${connection.id}`)

    this.updateUsers()
  }

  /**
   * Called when this room receives a message from a connected client.
   *
   * Expected inbound payload format:
   * - JSON string, which is parsed and then validated against Zod schemas.
   *
   * Message categories:
   * 1) Presence messages (`PresenceMessageSchema`)
   *    - "add-user": associate this socket with a user (stored in connection.state)
   *    - "remove-user": clear user association
   *    - "presence": server-to-client snapshot (not expected from client)
   *
   * 2) Channel realtime events (`ChannelEventSchema`)
   *    - "message:created", "message:updated", "reaction:udpated", etc.
   *
   * Flow:
   * - Try parse as Presence message; handle if valid.
   * - Otherwise, try parse as Channel event; if valid, broadcast to other clients.
   * - If it matches neither schema, ignore (or log) the payload.
   *
   * @param connection - The connection that sent the message.
   * @param message - Raw message string received over the WebSocket.
   */
  onMessage(connection: Connection, message: string) {
    try {
      // Convert JSON string -> JS object
      const parsed = JSON.parse(message)

      // Validate incoming message shape against Zod schema
      const presenceEvent = PresenceMessageSchema.safeParse(parsed)

      // 1) Presence protocol handling
      if (presenceEvent.success) {
        if (presenceEvent.data.type === "add-user") {
          // Store the user on the server-side per-socket state for this connection.
          this.setConnectionState(connection, {
            user: presenceEvent.data.payload,
          })

          // Broadcast updated presenceEvent to all connected clients
          this.updateUsers()
          return
        }

        if (presenceEvent.data.type === "remove-user") {
          // Clear per-socket user state
          this.setConnectionState(connection, null)

          // Broadcast updated presenceEvent to everyone
          this.updateUsers()
          return
        }
      }

      // 2) Channel realtime event handling
      const channelEvent = ChannelEventSchema.safeParse(parsed)

      if (channelEvent.success) {
        const payload = JSON.stringify(channelEvent.data)

        /**
         * Broadcast to all connections in this room EXCEPT the sender.
         * This prevents the sender from processing the same event twice.
         *
         * IMPORTANT:
         * Because the sender is excluded, the sender's UI should update via:
         * - optimistic UI update, OR
         * - local cache update, OR
         * - refetching after the server acknowledges the mutation.
         */
        this.broadcast(payload, [connection.id])
        return
      }

      // 2) Thread realtime event handling
      const threadEvent = ThreadEventSchema.safeParse(parsed)
      if (threadEvent.success) {
        const payload = JSON.stringify(threadEvent.data)

        /**
         * Broadcast to all connections in this room EXCEPT the sender.
         * This prevents the sender from processing the same event twice.
         *
         * IMPORTANT:
         * Because the sender is excluded, the sender's UI should update via:
         * - optimistic UI update, OR
         * - local cache update, OR
         * - refetching after the server acknowledges the mutation.
         */
        this.broadcast(payload, [connection.id])
        return
      }
    } catch (error) {
      console.log("Error processing message", error)
    }
  }

  /**
   * Broadcast the current presenceEvents snapshot to all active WebSocket connections in this room.
   *
   * Presence is derived from:
   * - all active connections (getConnections())
   * - each connection’s validated state (connection.state -> ConnectionState)
   */
  updateUsers() {
    const presenceMessage = JSON.stringify(this.getPresenceMessage())

    //Use partyserver, built in broadcast method
    this.broadcast(presenceMessage)
  }

  /**
   * Construct a "presence" message that matches PresenceMessageSchema
   * using the current unique users for this room.
   */
  getPresenceMessage() {
    return {
      type: "presence",
      payload: { users: this.getUsers() },
    } satisfies z.infer<typeof PresenceMessageSchema>
  }

  /**
   * Compute the unique list of users currently online in this room.
   *
   * Implementation detail:
   * - iterate all active WebSocket connections
   * - read validated connection.state
   * - de-dupli users by user.id using a Map
   *
   * If the same user opens multiple tabs/devices, they may create multiple connections,
   * but they will appear once in the returned list because we key by user.id.
   */
  getUsers() {
    const usersById = new Map<string, z.infer<typeof UserSchema>>()

    for (const connection of this.getConnections()) {
      const state = this.getConnectionState(connection)

      if (state?.user) {
        usersById.set(state.user.id, state.user)
      }
    }

    return Array.from(usersById.values())
  }

  /**
   * Helper: set per-connection (per-socket) ephemeral state.
   *
   * `private` means it can be called only within this class (not from subclasses).
   */
  private setConnectionState(connection: Connection, state: ConnectionState) {
    connection.setState(state)
  }

  /**
   * Helper: safely retrieve and validate the current connection.state using Zod.
   * Returns null if state is missing/invalid.
   */
  private getConnectionState(connection: Connection): ConnectionState {
    const result = ConnectionStateSchema.safeParse(connection.state)

    if (result.success) {
      return result.data
    }

    return null
  }
}

export default {
  /**
 * Cloudflare Worker entry point and environment configuration
 *
 * This file defines the runtime entry point for the Cloudflare Worker.
 * Cloudflare Workers require a **default export** that implements a `fetch` handler.
 * The `fetch` function is invoked for **every incoming HTTP request** (including
 * WebSocket upgrade requests).
 *

 * Environment (`env`) and Wrangler
 * ---------------------------------
 *
 * The `env` parameter contains all runtime bindings configured via Wrangler,
 * such as Durable Objects, KV namespaces, secrets, and other Cloudflare resources.
 *
 * The `Env` TypeScript type is generated and managed by **Wrangler**, Cloudflare’s
 * official CLI tool for developing, testing, and deploying Workers.
 *
 * Wrangler responsibilities:
 * - Build and bundle Worker code
 * - Generate strongly-typed `env` bindings for TypeScript
 * - Run Workers locally during development
 * - Deploy Workers and Durable Objects to Cloudflare
 * - Apply Durable Object migrations
 *
 * Typical workflow:
 * - `wrangler init`    → initialize a new Worker project
 * - `wrangler dev`     → run the Worker locally with live reload
 * - `wrangler deploy`  → deploy the Worker and Durable Objects
 *
 * The Worker code itself runs on Cloudflare’s global edge infrastructure.
 * Wrangler is a local development and deployment tool and does not run in production.
 *

 * Request routing with PartyServer
 *----------------------------------
 *
 * `routePartykitRequest(request, env)` is a helper provided by PartyServer that:
 * - inspects the incoming request URL,
 * - determines whether it matches PartyServer / PartyKit routing conventions,
 * - forwards the request to the appropriate Durable Object instance,
 * - handles WebSocket upgrades for realtime connections,
 * - returns a `Response` if the request is handled.
 *
 * If `routePartykitRequest` does not handle the request, it returns `null` or
 * `undefined`, and this handler falls back to a `404 Not Found` response.
 *
 * This pattern effectively turns the Worker into a router:
 * - PartyServer routes → handled (including WebSocket connections)
 * - All other routes   → 404 Not Found
 */
  async fetch(request: Request, env: Env): Promise<Response> {
    return (
      (await routePartykitRequest(request, env)) ||
      new Response("Not Found", { status: 404 })
    )
  },
} satisfies ExportedHandler<Env>
