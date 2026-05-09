import { auth } from "@/lib/auth/auth"
import z from "zod"
import { heavyWriteSecurityMiddleware } from "../middlewares/arcjet/heavy-write"
import { readSecurityMiddleware } from "../middlewares/arcjet/read"
import { standardSecurityMiddleware } from "../middlewares/arcjet/standard"
import { requiredAuthMiddleware } from "../middlewares/auth"
import { base } from "../middlewares/base"
import { requiredWorkspaceMiddleware } from "../middlewares/workspace"
import { InviteMemberSchema } from "../schemas/member"

type ListMembersResponse = Awaited<ReturnType<typeof auth.api.listMembers>>

export type BetterAuthMember = ListMembersResponse["members"][number]

export const inviteMember = base
  .use(requiredAuthMiddleware)
  .use(requiredWorkspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(heavyWriteSecurityMiddleware)
  .route({
    method: "POST",
    path: "/workspace/members/invite",
    summary: "Invite Member",
    tags: ["Members"],
  })
  .input(InviteMemberSchema)
  .output(z.void())
  .handler(async ({ input, context }) => {
    const headers = new Headers(context.request.headers as HeadersInit)
    await auth.api.createInvitation({
      body: {
        email: input.email,
        role: input.role,
        organizationId: context.workspace.id,
      },
      headers,
    })

    // await Users.createUser({
    //   requestBody: {
    //     organization_code: context.workspace.id,
    //     profile: {
    //       given_name: input.name,
    //       picture: getAvatar(null, input.email!),
    //     },

    //     //how will user login ? using email identity
    //     identities: [
    //       {
    //         type: "email",
    //         details: {
    //           email: input.email,
    //         },
    //       },
    //     ],
    //   },
    // })
  })

export const listMembers = base
  .use(requiredAuthMiddleware)
  .use(requiredWorkspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .route({
    method: "GET",
    path: "/workspace/members",
    summary: "List all members",
    tags: ["Members"],
  })
  .input(z.void())
  .output(z.array(z.custom<BetterAuthMember>()))
  .handler(async ({ context, errors }) => {
    try {
      const membersData = await auth.api.listMembers({
        query: {
          organizationId: context.workspace.id,
          sortBy: "createdAt",
          sortDirection: "desc",
        },
        headers: new Headers(context.request.headers as HeadersInit),
      })

      if (!membersData.members) {
        throw errors.NOT_FOUND()
      }

      return membersData.members
    } catch {
      throw errors.INTERNAL_SERVER_ERROR()
    }
  })
