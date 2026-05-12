import { auth } from "@/lib/auth/auth"
import prisma from "@/lib/db"
import { normalizeChannelName } from "@/lib/utlis/normalize-channel-name"
import { toWorkspaceSlug } from "@/lib/workspace/toWorkspaceSlug"

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

export async function createWorkspaceWithDefaultChannels({
  organizationName,
  userId,
  headers,
}: {
  organizationName: string
  userId: string
  headers: Headers
}) {
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

  const channelNames = buildDefaultOrganizationChannelNames(organizationName)

  await prisma.channel.createMany({
    data: channelNames.map((name) => ({
      name,
      organizationId: organization.id,
      createdById: userId,
    })),
    skipDuplicates: true,
  })

  await auth.api.setActiveOrganization({
    body: {
      organizationId: organization.id,
    },
    headers,
  })

  return {
    organizationId: organization.id,
    organizationName: organization.name,
    channelNames,
  }
}
