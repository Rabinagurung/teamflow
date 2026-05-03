import { auth } from "@/lib/auth/auth"
import { polarClient } from "@/lib/auth/polar"
import prisma from "@/lib/db"
import { splitUserName } from "@/lib/onboarding/split-user-name"
import { z } from "zod"
import { heavyWriteSecurityMiddleware } from "../middlewares/arcjet/heavy-write"
import { readSecurityMiddleware } from "../middlewares/arcjet/read"
import { standardSecurityMiddleware } from "../middlewares/arcjet/standard"
import { writeSecurityMiddleware } from "../middlewares/arcjet/write"
import { requiredAuthMiddleware } from "../middlewares/auth"
import { base } from "../middlewares/base"
import {
  appEntryResultSchema,
  onboardingInviteSchema,
  onboardingProfileSchema,
  onboardingStateSchema,
  onboardingStepSchema,
} from "../schemas/onboarding"
import { workspaceSchema } from "../schemas/workspace"

const toWorkspaceSlug = (name: string) =>
  `${name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}-${crypto.randomUUID().slice(0, 8)}`

const resolveCurrentStep = (
  state: {
    hasCompletedProfile: boolean
    hasCreatedWorkspace: boolean
    hasInvitedMembers: boolean
    hasCompletedBilling: boolean
  } | null,
) => {
  if (!state?.hasCompletedProfile) return "profile" as const
  if (!state?.hasCreatedWorkspace) return "workspace" as const
  if (!state?.hasInvitedMembers) return "invite" as const
  if (!state?.hasCompletedBilling) return "billing" as const

  return null
}

const mergeMetadata = (
  current: string | null,
  patch: Record<string, unknown>,
) => {
  console.log("submitOnboardingInvites procedures current org metadata: ", {
    current,
  })

  console.log("submitOnboardingInvites procedures mergeMetada patch : ", {
    patch,
  })

  const parsed =
    current && current.trim().length > 0
      ? (JSON.parse(current) as Record<string, unknown>)
      : {}

  return JSON.stringify({ ...parsed, ...patch })
}

const getOnboardingWorkspace = async (userId: string) => {
  const state = await prisma.onboardingState.findUnique({
    where: { userId },
    select: { workspaceId: true },
  })

  if (!state?.workspaceId) return null

  return prisma.organization.findFirst({
    where: {
      id: state.workspaceId,
      members: { some: { userId } },
    },

    select: {
      id: true,
      name: true,
      metadata: true,
    },
  })
}

export const getAppEntry = base
  .use(requiredAuthMiddleware)
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .route({
    method: "GET",
    path: "/onboarding/entry",
    summary: "Resolve authenticated app entry route",
    tags: ["onboarding"],
  })
  .input(z.void())
  .output(appEntryResultSchema)
  .handler(async ({ context }) => {
    console.log(context.user.id)
    const row = await prisma.onboardingState.findUnique({
      where: { userId: context.user.id },
      select: {
        hasCompletedProfile: true,
        hasCreatedWorkspace: true,
        hasInvitedMembers: true,
        hasCompletedBilling: true,
      },
    })

    console.log("GET APP ENTRY PROCEDURE: ", { row })

    const step = resolveCurrentStep(row)

    console.log("GET APP ENTRY PROCEDURE: ", { step })

    if (row && step) return { kind: "onboarding", step }

    const organizations = await auth.api.listOrganizations({
      headers: new Headers(context.request.headers as HeadersInit),
    })

    console.log("GET APP ENTRY PROCEDURE: ", { organizations })
    return organizations.length === 0
      ? { kind: "no-workspace" }
      : { kind: "get-started" }
  })

export const getOnboardingState = base
  .use(requiredAuthMiddleware)
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .route({
    method: "GET",
    path: "/onboarding/state",
    summary: "Get onboarding state for current user",
    tags: ["onboarding"],
  })
  .input(z.void())
  .output(onboardingStateSchema)
  .handler(async ({ context }) => {
    const row = await prisma.onboardingState.findUnique({
      where: {
        userId: context.user.id,
      },
    })

    console.log("getOnboardingState", { row })

    const workspace = row?.workspaceId
      ? await prisma.organization.findUnique({
          where: {
            id: row.workspaceId,
          },
          select: {
            id: true,
            name: true,
          },
        })
      : null

    console.log("getOnboardingState", { workspace })

    return {
      user: context.user,
      state: {
        workspaceId: row?.workspaceId ?? null,
        workspaceName: workspace?.name ?? null,
        hasCompletedProfile: row?.hasCompletedProfile ?? false,
        hasCreatedWorkspace: row?.hasCreatedWorkspace ?? false,
        hasInvitedMembers: row?.hasInvitedMembers ?? false,
        hasCompletedBilling: row?.hasCompletedBilling ?? false,
        currentStep: resolveCurrentStep(row),
      },
    }
  })

export const saveOnboardingProfile = base
  .use(requiredAuthMiddleware)
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .route({
    method: "POST",
    path: "/onboarding/profile",
    summary: "Get onboarding profile step",
    tags: ["onboarding"],
  })
  .input(onboardingProfileSchema)
  .output(
    z.object({
      nextStep: onboardingStepSchema,
    }),
  )
  .handler(async ({ context, input }) => {
    const { given_name, family_name } = splitUserName(input.name)
    await prisma.user.update({
      where: { id: context.user.id },
      data: {
        name: input.name,
        given_name,
        family_name,
      },
    })

    await prisma.onboardingState.upsert({
      where: {
        userId: context.user.id,
      },
      create: {
        userId: context.user.id,
        hasCompletedProfile: true,
        currentStep: "workspace",
      },
      update: {
        hasCompletedProfile: true,
        currentStep: "workspace",
      },
    })

    return { nextStep: "workspace" }
  })

export const createOnboardingWorkspace = base
  .use(requiredAuthMiddleware)
  .use(standardSecurityMiddleware)
  .use(heavyWriteSecurityMiddleware)
  .route({
    method: "POST",
    path: "/onboarding/workspace",
    summary: "Create workspace during onboarding",
    tags: ["onboarding"],
  })
  .input(workspaceSchema)
  .output(
    z.object({
      workspaceId: z.string(),
      workspaceName: z.string(),
      nextStep: onboardingStepSchema,
    }),
  )
  .handler(async ({ context, input, errors }) => {
    const organization = await auth.api.createOrganization({
      body: {
        name: input.name,
        slug: toWorkspaceSlug(input.name),
        userId: context.user.id,
      },
      headers: new Headers(context.request.headers as HeadersInit),
    })

    if (!organization?.id) {
      throw errors.INTERNAL_SERVER_ERROR({
        message: "Failed to create workspace",
      })
    }

    await auth.api.setActiveOrganization({
      body: { organizationId: organization.id },
      headers: new Headers(context.request.headers as HeadersInit),
    })

    await prisma.channel.create({
      data: {
        name: "general",
        workspaceId: organization.id,
        createdById: context.user.id,
      },
    })

    await prisma.onboardingState.upsert({
      where: {
        userId: context.user.id,
      },
      create: {
        userId: context.user.id,
        workspaceId: organization.id,
        hasCompletedProfile: true,
        hasCreatedWorkspace: true,
        currentStep: "invite",
      },
      update: {
        workspaceId: organization.id,
        hasCreatedWorkspace: true,
        currentStep: "invite",
      },
    })

    return {
      workspaceId: organization.id,
      workspaceName: organization.name,
      nextStep: "invite",
    }
  })

export const submitOnboardingInvites = base
  .use(requiredAuthMiddleware)
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .route({
    method: "POST",
    path: "/onboarding/invite",
    summary: "Invite members during onboarding",
    tags: ["onboarding"],
  })
  .input(onboardingInviteSchema)
  .output(
    z.object({
      invitedCount: z.number(),
      failedEmails: z.array(z.string()),
      nextStep: onboardingStepSchema,
    }),
  )
  .handler(async ({ context, input, errors }) => {
    const workspace = await getOnboardingWorkspace(context.user.id)

    if (!workspace) {
      throw errors.FORBIDDEN({ message: "No onboarding workspace found" })
    }

    const normalizedEmails = Array.from(
      new Set(input.emails.map((email) => email.trim().toLowerCase())),
    )

    console.log("submitOnboardingInvites procedures: ", { normalizedEmails })

    const selfEmail = context.user.email.toLowerCase()
    const inviteableEmails = normalizedEmails.filter(
      (email) => email !== selfEmail,
    )
    const failedEmails = normalizedEmails.filter((email) => email === selfEmail)

    const headers = new Headers(context.request.headers as HeadersInit)

    const results = await Promise.allSettled(
      inviteableEmails.map((email) =>
        auth.api.createInvitation({
          body: {
            email,
            role: "member",
            organizationId: workspace.id,
          },
          headers,
        }),
      ),
    )

    console.log("Results from Promise.allSettled createInvites : ", { results })
    failedEmails.push(
      ...results.flatMap((result, index) =>
        result.status === "rejected" ? [inviteableEmails[index]!] : [],
      ),
    )

    console.log("submitOnboardingInvites procedures: ", { failedEmails })
    const invitedCount = normalizedEmails.length - failedEmails.length

    if (invitedCount > 0) {
      await prisma.$transaction([
        prisma.organization.update({
          where: {
            id: workspace.id,
          },
          data: {
            metadata: mergeMetadata(workspace.metadata, {
              onboarding: {
                invitedCount,
                invitedAt: new Date().toISOString(),
              },
            }),
          },
        }),

        prisma.onboardingState.update({
          where: { userId: context.user.id },
          data: {
            hasInvitedMembers: true,
            currentStep: "billing",
          },
        }),
      ])
    }

    return {
      invitedCount,
      failedEmails,
      nextStep: invitedCount > 0 ? "billing" : "invite",
    }
  })

export const skipOnboardingInvites = base
  .use(requiredAuthMiddleware)
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .route({
    method: "POST",
    path: "/onboarding/invite/skip",
    summary: "Skip invite step",
    tags: ["onboarding"],
  })
  .input(z.void())
  .output(z.object({ nextStep: onboardingStepSchema }))
  .handler(async ({ context, errors }) => {
    const workspace = await getOnboardingWorkspace(context.user.id)
    if (!workspace)
      throw errors.FORBIDDEN({ message: "No onboarding workspace found" })

    await prisma.$transaction([
      prisma.organization.update({
        where: { id: workspace.id },
        data: {
          metadata: mergeMetadata(workspace.metadata, {
            onboarding: {
              skippedInvitesAt: new Date().toISOString(),
            },
          }),
        },
      }),

      prisma.onboardingState.update({
        where: { userId: context.user.id },
        data: {
          hasInvitedMembers: true,
          currentStep: "billing",
        },
      }),
    ])

    return { nextStep: "billing" }
  })

export const startOnboardingFreePlan = base
  .use(requiredAuthMiddleware)
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .route({
    method: "POST",
    path: "/onboarding/billing/free",
    summary: "Start free trial during onboarding",
    tags: ["onboarding"],
  })
  .input(z.void())
  .output(z.object({ workspaceId: z.string(), redirectTo: z.string() }))
  .handler(async ({ context, errors }) => {
    const workspace = await getOnboardingWorkspace(context.user.id)

    if (!workspace) {
      throw errors.FORBIDDEN({ message: "No onboarding workspace found" })
    }

    const now = new Date()
    console.log("startOnboardingFreePlan procedure: ", { now })
    const trialEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    console.log("startOnboardingFreePlan procedure : ", { trialEndsAt })

    await prisma.$transaction([
      prisma.organization.update({
        where: { id: workspace.id },
        data: {
          metadata: mergeMetadata(workspace.metadata, {
            billing: {
              plan: "free",
              status: "trialing",
              trialStartedAt: now.toISOString(),
              trialEndsAt: trialEndsAt.toISOString(),
            },
          }),
        },
      }),

      prisma.onboardingState.update({
        where: {
          userId: context.user.id,
        },
        data: {
          hasCompletedBilling: true,
          currentStep: null,
        },
      }),
    ])

    return {
      workspaceId: workspace.id,
      redirectTo: `/workspace/${workspace.id}`,
    }
  })

export const completeOnboardingProPlan = base
  .use(requiredAuthMiddleware)
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .route({
    method: "POST",
    path: "/onboarding/billing/pro/complete",
    summary: "Complete paid onboarding after Polar checkout",
    tags: ["onboarding"],
  })
  .input(z.void())
  .output(z.object({ workspaceId: z.string(), redirectTo: z.string() }))
  .handler(async ({ context, errors }) => {
    const workspace = await getOnboardingWorkspace(context.user.id)

    if (!workspace) {
      throw errors.FORBIDDEN({ message: "No onboarding workspace found" })
    }

    const customerState = await polarClient.customers.getStateExternal({
      externalId: context.user.id,
    })
    const activeSubscription = customerState.activeSubscriptions[0]

    if (!activeSubscription) {
      throw errors.BAD_REQUEST({
        message: "No active Polar subscription found",
      })
    }

    await prisma.$transaction([
      prisma.organization.update({
        where: { id: workspace.id },
        data: {
          metadata: mergeMetadata(workspace.metadata, {
            billing: {
              plan: "pro",
              status: "active",
              activatedAt: new Date().toISOString(),
              polarCustomerId: customerState.id,
              polarSubscriptionId: activeSubscription.id,
            },
          }),
        },
      }),
      prisma.onboardingState.update({
        where: { userId: context.user.id },
        data: {
          hasCompletedBilling: true,
          currentStep: null,
        },
      }),
    ])

    return {
      workspaceId: workspace.id,
      redirectTo: `/workspace/${workspace.id}`,
    }
  })
