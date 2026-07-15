import { auth } from "@/lib/auth/auth"
import prisma from "@/lib/db"
import { Channel } from "@/lib/generated/prisma/client"
import z from "zod"
import { heavyWriteSecurityMiddleware } from "../middlewares/arcjet/heavy-write"
import { readSecurityMiddleware } from "../middlewares/arcjet/read"
import { standardSecurityMiddleware } from "../middlewares/arcjet/standard"
import { requiredAuthMiddleware } from "../middlewares/auth"
import { base } from "../middlewares/base"
import { requiredWorkspaceMiddleware } from "../middlewares/workspace"
import { ChannelNameSchema } from "../schemas/channel"
import { appUserSchema } from "../schemas/user"
import { appWorkspaceSchema } from "../schemas/workspace"
import { organization_user } from "../schemas/organization-user"
import { rethrowORPCError } from "./_shared/rethrow-orpc-error"
import { BETTER_AUTH_ORGANIZATION_ERRORS } from "./_shared/better-auth-organization-errors"

type WorkspaceMember = Awaited<
  ReturnType<typeof auth.api.listMembers>
>["members"][number]

const toOrganizationUser = (member: WorkspaceMember): organization_user => {
  const fullName = member.user.name?.trim() ?? ""
  const [firstName, ...lastNameParts] = fullName.split(/\s+/)

  return {
    id: member.user.id,
    email: member.user.email,
    full_name: fullName,
    first_name: firstName || null,
    last_name: lastNameParts.length > 0 ? lastNameParts.join(" ") : null,
    picture: member.user.image ?? null,
    joined_on: member.createdAt.toISOString(),
    roles: [member.role],
  }
}

export const createChannel = base
  .use(requiredAuthMiddleware)
  .use(requiredWorkspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(heavyWriteSecurityMiddleware)
  .route({
    method: "POST",
    path: "/channels",
    summary: "Create a new Channel",
    tags: ["Channels"],
  })
  .input(ChannelNameSchema)
  .output(z.custom<Channel>())
  .handler(async ({ input, context }) => {
    const channel = await prisma.channel.create({
      data: {
        name: input.name,
        organizationId: context.workspace.id,
        createdById: context.user.id,
      },
    })

    return channel
  })

export const listChannel = base
  .use(requiredAuthMiddleware)
  .use(requiredWorkspaceMiddleware)
  .route({
    method: "GET",
    path: "/channels",
    summary: "List all channels",
    tags: ["Channels"],
  })
  .input(z.void())
  .output(
    z.object({
      channels: z.array(z.custom<Channel>()),
      members: z.array(z.custom<organization_user>()),
      currentWorkspace: appWorkspaceSchema.nullable(),
    }),
  )
  .handler(async ({ context, errors }) => {
    const headers = new Headers(context.request.headers as HeadersInit)

    const channels = await prisma.channel.findMany({
      where: {
        organizationId: context.workspace.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    let membersData: Awaited<ReturnType<typeof auth.api.listMembers>>

    try {
      membersData = await auth.api.listMembers({
        query: {
          organizationId: context.workspace.id,
          sortBy: "createdAt",
          sortDirection: "desc",
        },
        headers,
      })
    } catch (error) {
      rethrowORPCError(error)

      if (
        error instanceof Error &&
        error.message === BETTER_AUTH_ORGANIZATION_ERRORS.ORGANIZATION_NOT_FOUND
      ) {
        throw errors.NOT_FOUND({
          message: "Workspace not found",
        })
      }

      if (
        error instanceof Error &&
        error.message === BETTER_AUTH_ORGANIZATION_ERRORS.USER_NOT_MEMBER
      ) {
        throw errors.FORBIDDEN({
          message: "NO_WORKSPACE",
        })
      }

      console.error("Failed to load channels members", error)

      throw errors.INTERNAL_SERVER_ERROR({
        message: "Unable to load workspace members.",
      })
    }

    if (!membersData.members) {
      throw errors.INTERNAL_SERVER_ERROR({
        message: "Unable to load workspace members.",
      })
    }

    return {
      channels,
      members: membersData.members.map(toOrganizationUser),
      currentWorkspace: context.workspace,
    }
  })

export const getChannel = base
  .use(requiredAuthMiddleware)
  .use(requiredWorkspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .route({
    method: "GET",
    path: "/channels/:channelId",
    summary: "Get a channel by ID",
    tags: ["channels"],
  })
  .input(z.object({ channelId: z.string() }))
  .output(
    z.object({
      channelName: z.string(),
      currentUser: appUserSchema,
    }),
  )
  .handler(async ({ context, input, errors }) => {
    const channel = await prisma.channel.findFirst({
      where: {
        id: input.channelId,
        organizationId: context.workspace.id,
      },
      select: {
        name: true,
      },
    })

    if (!channel) {
      throw errors.NOT_FOUND()
    }

    return {
      channelName: channel.name,
      currentUser: context.user,
    }
  })
