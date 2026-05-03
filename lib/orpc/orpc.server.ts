import "server-only"
//This file will only run on server side
import { createRouterClient } from "@orpc/server"
import { router } from "@/app/router"
import { request } from "@arcjet/next"

// This file allows us to call orpc data access layer through server components
globalThis.$client = createRouterClient(router, {
  /**
   * Provide initial context if needed.
   *
   * Because this client instance is shared across all requests,
   * only include context that's safe to reuse globally.
   * For per-request context, use middleware context or pass a function as the initial context.
   */
  context: async () => ({
    request: await request(),
  }),
})
