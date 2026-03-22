import { ArcjetNextRequest } from "@arcjet/next"
import { os } from "@orpc/server"
/**
 * Base procedure configuration for the API.
 *
 * This module defines a shared foundation that API procedures can build on
 * to ensure consistent context typing and centralized, type-safe error
 * definitions across the application.
 *
 *
 * The base configuration:
 * - Declares the common context shape available to procedures
 * - Registers a fixed set of application-level error identifiers
 * - Enables compile-time validation of thrown errors
 *In oRPC, os is a “server builder” object.
 *
 * Methods like:
 * os.route(...) (or whatever your version calls it)
 * os.$context<...>()
 * .errors(...)
 * .use(...)
 * are used to build up a typed procedure/router definition.
 *
 * $context<...>() specifically $context<T>() says:
 *
 * “From this point onward, procedures built from this builder
 * will have ctx (or context) typed as T.”
 *
 * .$context<{ request: Request | ArcjetNextRequest }>():
 * This means handlers can safely access: ctx.request (or context.request)
 * and TypeScript will know it’s a real Request.
 *
 *
 *
 * Usage:
 * Procedures should use `base.route()` instead of `os.route()` to inherit
 * the shared context and error definitions provided by this module,
 *
 * Notes:
 * - This module does not implement runtime behavior such as authentication,
 *   authorization, rate limiting, or logging.
 * - Error handling behavior (HTTP status mapping, logging, serialization)
 *   is expected to be handled by the surrounding framework or adapters.
 * - os.$context<{ request: Request }>()
 *  This line does not create a request at runtime by itself.
 *  It sets the expected shape of the context object that your adapter/middleware must provide at runtime.
 */

/**
 * Shared base procedure builder.
 *
 * Provides a strongly typed context and a centralized catalog of
 * application-level errors for procedures that opt into it.
 *
 *
 * Procedures created using this base:
 * - Have access to the declared context via `ctx`
 * - Can only throw errors defined in the registered error catalog
 *
 * Errors can be thrown using:
 * `throw base.error("FORBIDDEN")`
 *
 * passes error by itself But base does not pass request by itself instead get the request as context.
 * Where do we pass the request to context ? rpc/route.ts
 *
 * @example
 * base.route()
 *   .input(schema)
 *   .handler(({ ctx }) => {
 *     if (!ctx.request) {
 *       throw base.error("UNAUTHORIZED")
 *     }
 *   })
 */
export const base = os
  .$context<{ request: Request | ArcjetNextRequest }>()
  .errors({
    RATE_LIMITED: {
      message: "You are being rate limited.",
    },
    BAD_REQUEST: {
      message: "Bad request",
    },
    NOT_FOUND: {
      message: "Not found",
    },
    FORBIDDEN: {
      message: "This is forbidden",
    },
    UNAUTHORIZED: {
      message: "You are Unauthorized",
    },
    INTERNAL_SERVER_ERROR: {
      message: "Internal Server Error",
    },
  })
