import { ORPCError } from "@orpc/server"

export const rethrowORPCError = (error: unknown) => {
  if (error instanceof ORPCError) {
    throw error
  }
}
