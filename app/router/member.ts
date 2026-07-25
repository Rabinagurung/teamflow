import { auth } from "@/lib/auth/auth"
import z from "zod"
import { heavyWriteSecurityMiddleware } from "../middlewares/arcjet/heavy-write"
import { readSecurityMiddleware } from "../middlewares/arcjet/read"
import { standardSecurityMiddleware } from "../middlewares/arcjet/standard"
import { requiredAuthMiddleware } from "../middlewares/auth"
import { base } from "../middlewares/base"
import { requiredWorkspaceMiddleware } from "../middlewares/workspace"
import { InviteMemberSchema } from "../schemas/member"
import { rethrowORPCError } from "./_shared/rethrow-orpc-error"
import { BETTER_AUTH_ORGANIZATION_ERRORS } from "./_shared/better-auth-organization-errors"
import {
  inviteWorkspaceMembers,
  workspaceInviteMembersResultSchema,
} from "./_shared/workspace-invitations"

type ListMembersResponse = Awaited<ReturnType<typeof auth.api.listMembers>>
export type BetterAuthMember = ListMembersResponse["members"][number]

/**
 Why this is clean:
  -inviteMember maps Better Auth invite failures
  -listMembers has no blanket catch, so real backend meaning survives
 */
export const inviteMember = base
  .use(requiredAuthMiddleware)
  .use(requiredWorkspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(heavyWriteSecurityMiddleware)
  .route({
    method: "POST",
    path: "/members/invite",
    summary: "Invite Member",
    tags: ["Members"],
  })
  .input(InviteMemberSchema)
  .output(workspaceInviteMembersResultSchema)
  .handler(async ({ input, context, errors }) => {
    try {
      return await inviteWorkspaceMembers({
        workspaceId: context.workspace.id,
        requesterEmail: context.user.email,
        emails: input.emails,
        headers: new Headers(context.request.headers as HeadersInit),
      })
    } catch (error) {
      rethrowORPCError(error)

      if (
        error instanceof Error &&
        error.message === BETTER_AUTH_ORGANIZATION_ERRORS.ORGANIZATION_NOT_FOUND
      ) {
        throw errors.NOT_FOUND({
          message: "Workspace not found.",
        })
      }

      if (
        error instanceof Error &&
        (error.message === BETTER_AUTH_ORGANIZATION_ERRORS.USER_NOT_MEMBER ||
          error.message === BETTER_AUTH_ORGANIZATION_ERRORS.INVITE_FORBIDDEN)
      ) {
        throw errors.FORBIDDEN({
          message: "You do not have permission to invite members.",
        })
      }

      console.error("Failed to invite members", error)

      throw errors.INTERNAL_SERVER_ERROR({
        message: "Unable to invite members.",
      })
    }
  })

export const listMembers = base
  .use(requiredAuthMiddleware)
  .use(requiredWorkspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .route({
    method: "GET",
    path: "/members",
    summary: "List all members",
    tags: ["Members"],
  })
  .input(z.void())
  .output(z.array(z.custom<BetterAuthMember>()))
  .handler(async ({ context, errors }) => {
    const membersData = await auth.api.listMembers({
      query: {
        organizationId: context.workspace.id,
        sortBy: "createdAt",
        sortDirection: "desc",
      },
      headers: new Headers(context.request.headers as HeadersInit),
    })

    if (!membersData.members) {
      throw errors.NOT_FOUND({
        message: "Workspace members were not found.",
      })
    }

    return membersData.members
  })
