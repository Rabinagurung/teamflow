import { auth } from "@/lib/auth/auth"
import prisma from "@/lib/db"
import { normalizeChannelName } from "@/lib/utlis/normalize-channel-name"
import { toWorkspaceSlug } from "@/lib/workspace/toWorkspaceSlug"
import { z } from "zod"

const CHANNEL_NAME_MAX_LENGTH = 50
const ALL_CHANNEL_PREFIX = "all-"

const buildAllOrganizationChannelName = (organizationName: string) => {
  const normalizedOrganizationName = normalizeChannelName(organizationName)
  const maxSuffixLength = CHANNEL_NAME_MAX_LENGTH - ALL_CHANNEL_PREFIX.length
  const suffix = normalizedOrganizationName.slice(0, maxSuffixLength)

  return suffix.length > 0 ? `${ALL_CHANNEL_PREFIX}${suffix}` : "all-team"
}

export const buildDefaultOrganizationChannelNames = (
  organizationName: string,
) => {
  return Array.from(
    new Set([
      "general",
      "social",
      buildAllOrganizationChannelName(organizationName),
    ]),
  )
}

const workspaceInitializationSchema = z.object({
  channelsReady: z.boolean(),
  activeWorkspaceSet: z.boolean(),
})

export const completeWorkspaceCreationResultSchema = z.object({
  status: z.literal("complete"),
  workspaceId: z.string(),
  workspaceName: z.string(),
  initialization: z.object({
    channelsReady: z.literal(true),
    activeWorkspaceSet: z.literal(true),
  }),
})

export const partialWorkspaceCreationResultSchema = z.object({
  status: z.literal("partial"),
  workspaceId: z.string(),
  workspaceName: z.string(),
  initialization: workspaceInitializationSchema,
  message: z.string(),
})

export const workspaceCreationResultSchema = z.discriminatedUnion("status", [
  completeWorkspaceCreationResultSchema,
  partialWorkspaceCreationResultSchema,
])

export type WorkspaceCreationResult = z.infer<
  typeof workspaceCreationResultSchema
>

const buildPartialWorkspaceMessage = ({
  workspaceName,
  channelsReady,
  activeWorkspaceSet,
}: {
  workspaceName: string
  channelsReady: boolean
  activeWorkspaceSet: boolean
}) => {
  if (!channelsReady && !activeWorkspaceSet) {
    return `Workspace "${workspaceName}" was created, but default channels and workspace activation could not be completed.`
  }

  if (!channelsReady) {
    return `Workspace "${workspaceName}" was created, but default channels could not be initialized completely.`
  }

  return `Workspace "${workspaceName}" was created, but it could not be activated automatically.`
}

export async function ensureDefaultWorkspaceChannels({
  organizationId,
  organizationName,
  userId,
}: {
  organizationId: string
  organizationName: string
  userId: string
}) {
  const channelNames = buildDefaultOrganizationChannelNames(organizationName)

  await prisma.$transaction(async (tx) => {
    await tx.channel.createMany({
      data: channelNames.map((name) => ({
        name,
        organizationId,
        createdById: userId,
      })),
      skipDuplicates: true,
    })
  })

  return channelNames
}

export async function activateWorkspace({
  organizationId,
  headers,
}: {
  organizationId: string
  headers: Headers
}) {
  await auth.api.setActiveOrganization({
    body: {
      organizationId,
    },
    headers,
  })
}

export async function createWorkspaceWithSetup({
  organizationName,
  userId,
  headers,
}: {
  organizationName: string
  userId: string
  headers: Headers
}): Promise<WorkspaceCreationResult> {
  const organization = await auth.api.createOrganization({
    body: {
      name: organizationName,
      slug: toWorkspaceSlug(organizationName),
      userId,
    },
    headers,
  })

  if (!organization?.id) {
    throw new Error("Failed to create organization")
  }

  const workspaceId = organization.id
  const workspaceName = organization.name ?? organizationName

  let channelsReady = false
  let activeWorkspaceSet = false

  try {
    await ensureDefaultWorkspaceChannels({
      organizationId: workspaceId,
      organizationName: workspaceName,
      userId,
    })

    channelsReady = true
  } catch (error) {
    console.error("Failed to initialize default channels", {
      workspaceId,
      error,
    })
  }

  try {
    await activateWorkspace({
      organizationId: workspaceId,
      headers,
    })
    activeWorkspaceSet = true
  } catch (error) {
    console.error("Failed to activate workspace", {
      workspaceId,
      error,
    })
  }

  if (channelsReady && activeWorkspaceSet) {
    return {
      status: "complete",
      workspaceId,
      workspaceName,
      initialization: {
        channelsReady: true,
        activeWorkspaceSet: true,
      },
    }
  }

  return {
    status: "partial",
    workspaceId,
    workspaceName,
    initialization: {
      channelsReady,
      activeWorkspaceSet,
    },
    message: buildPartialWorkspaceMessage({
      workspaceName,
      channelsReady,
      activeWorkspaceSet,
    }),
  }
}

// const CHANNEL_NAME_MAX_LENGTH = 50
// const ALL_CHANNEL_PREFIX = "all-"

// const buildAllOrganizationChannelName = (organizationName: string) => {
//   const normalizedOrganizationName = normalizeChannelName(organizationName)
//   const maxSuffixLength = CHANNEL_NAME_MAX_LENGTH - ALL_CHANNEL_PREFIX.length
//   const suffix = normalizedOrganizationName.slice(0, maxSuffixLength)

//   return suffix.length > 0 ? `${ALL_CHANNEL_PREFIX}${suffix}` : "all-team"
// }

// export const buildDefaultOrganizationChannelNames = (
//   organizationName: string,
// ) => {
//   return Array.from(
//     new Set([
//       "general",
//       "social",
//       buildAllOrganizationChannelName(organizationName),
//     ]),
//   )
// }

// export async function createWorkspaceWithDefaultChannels({
//   organizationName,
//   userId,
//   headers,
// }: {
//   organizationName: string
//   userId: string
//   headers: Headers
// }) {
//   const organization = await auth.api.createOrganization({
//     body: {
//       name: organizationName,
//       slug: toWorkspaceSlug(organizationName),
//       userId,
//     },
//     headers,
//   })

//   if (!organization?.id) {
//     throw new Error("Failed to create organization")
//   }

//   const channelNames = buildDefaultOrganizationChannelNames(organizationName)

//   await prisma.channel.createMany({
//     data: channelNames.map((name) => ({
//       name,
//       organizationId: organization.id,
//       createdById: userId,
//     })),
//     skipDuplicates: true,
//   })

//   await auth.api.setActiveOrganization({
//     body: {
//       organizationId: organization.id,
//     },
//     headers,
//   })

//   return {
//     organizationId: organization.id,
//     organizationName: organization.name,
//     channelNames,
//   }
// }
