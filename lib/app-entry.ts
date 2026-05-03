// import { auth } from "./auth"

import prisma from "@/lib/db"

import { OnboardingState } from "./generated/prisma/client"
import { resolveOnboardingStep } from "./onboarding/resolve-onboarding-step"
import { auth } from "./auth/auth"

export type WorkspaceItem = {
  id: string
  name: string
  memberCount: number
}

/**
 * This is the cleanest design because it lets you support:

first-time user with zero workspaces
returning user with many workspaces
active workspace restore
“create new workspace” from the picker
onboarding continuation for a chosen workspace
*/

export type AppEntry =
  | { kind: "login" }
  | { kind: "no-workspace" }
  | { kind: "workspace-picker"; workspaces: WorkspaceItem[] }
  | {
      kind: "onboarding"
      step: OnboardingState
    }
  | { kind: "workspace"; workspaceId: string }

export async function resolveAppEntry(headers: Headers): Promise<AppEntry> {
  const session = await auth.api.getSession({ headers })

  if (!session) {
    return { kind: "login" }
  }

  const onboardingState = await resolveOnboardingStep(session.user.id)

  if (onboardingState) {
    return {
      kind: "onboarding",
      step: onboardingState,
    }
  }

  const memberships = await prisma.member.findMany({
    where: { userId: session.user.id },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              members: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  if (memberships.length === 0) {
    return { kind: "no-workspace" }
  }

  if (session.session.activeOrganizationId) {
    return {
      kind: "workspace",
      workspaceId: session.session.activeOrganizationId,
    }
  }

  if (memberships.length === 1) {
    const workspaceId = memberships[0]!.organization.id

    await auth.api.setActiveOrganization({
      body: { organizationId: workspaceId },
      headers,
    })

    return {
      kind: "workspace",
      workspaceId,
    }
  }

  return {
    kind: "workspace-picker",
    workspace: memberships.map((membership) => ({
      id: membership.organization.id,
      name: membership.organization.name,
      memberCount: membership.organization._count.members,
    })),
  }
}
