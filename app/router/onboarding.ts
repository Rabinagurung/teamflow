import { auth } from "@/lib/auth/auth"

import {
  activateWorkspaceFreePlan,
  confirmWorkspaceProPlan,
  createWorkspaceCheckoutSession,
} from "@/lib/billing/workspace-billing.service"
import prisma from "@/lib/db"
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
  onboardingInviteSubmitResultSchema,
  onboardingProfileSchema,
  onboardingStateSchema,
  onboardingStepSchema,
} from "../schemas/onboarding"
import { workspaceSchema } from "../schemas/workspace"
import { BETTER_AUTH_ORGANIZATION_ERRORS } from "./_shared/better-auth-organization-errors"
import { rethrowORPCError } from "./_shared/rethrow-orpc-error"
import {
  completeWorkspaceCreationResultSchema,
  createWorkspaceWithSetup,
  partialWorkspaceCreationResultSchema,
  WorkspaceCreationResult,
} from "./_shared/workspace"
import {
  inviteWorkspaceMembers,
  WorkspaceInviteMembersResult,
} from "./_shared/workspace-invitations"

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
  // console.log("submitOnboardingInvites procedures current org metadata: ", {current})

  // console.log("submitOnboardingInvites procedures mergeMetada patch : ", {patch,})

  const parsed =
    current && current.trim().length > 0
      ? (JSON.parse(current) as Record<string, unknown>)
      : {}

  return JSON.stringify({ ...parsed, ...patch })
}

const getOnboardingWorkspace = async (userId: string) => {
  const state = await prisma.onboardingState.findUnique({
    where: { userId },
    select: { organizationId: true },
  })

  if (!state?.organizationId) return null

  return prisma.organization.findFirst({
    where: {
      id: state.organizationId,
      members: { some: { userId } },
    },

    select: {
      id: true,
      name: true,
      metadata: true,
    },
  })
}

const onboardingWorkspaceNextStepSchema = z.union([
  z.literal("workspace"),
  z.literal("invite"),
])

const onboardingWorkspaceCreationResultSchema = z.discriminatedUnion("status", [
  completeWorkspaceCreationResultSchema.extend({
    nextStep: z.literal("invite"),
  }),
  partialWorkspaceCreationResultSchema.extend({
    nextStep: onboardingWorkspaceNextStepSchema,
  }),
])

type OnboardingWorkspaceCreationResult = z.infer<
  typeof onboardingWorkspaceCreationResultSchema
>

const toOnboardingWorkspaceResult = ({
  creationResult,
  onboardingStateSaved,
}: {
  creationResult: WorkspaceCreationResult
  onboardingStateSaved: boolean
}): OnboardingWorkspaceCreationResult => {
  if (creationResult.status === "complete" && onboardingStateSaved) {
    return {
      ...creationResult,
      nextStep: "invite",
    }
  }

  return {
    status: "partial",
    workspaceId: creationResult.workspaceId,
    workspaceName: creationResult.workspaceName,
    initialization: creationResult.initialization,
    message: onboardingStateSaved
      ? creationResult.status === "partial"
        ? creationResult.message
        : `Workspace "${creationResult.workspaceName}" was created, but onboarding setup did not finish completely.`
      : `Workspace "${creationResult.workspaceName}" was created, but onboarding progress could not be saved.`,
    nextStep: onboardingStateSaved ? "invite" : "workspace",
  }
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
  .handler(async ({ context, errors }) => {
    // console.log(context.user.id)
    const row = await prisma.onboardingState.findUnique({
      where: { userId: context.user.id },
      select: {
        hasCompletedProfile: true,
        hasCreatedWorkspace: true,
        hasInvitedMembers: true,
        hasCompletedBilling: true,
      },
    })

    // console.log("GET APP ENTRY PROCEDURE: ", { row })

    const step = resolveCurrentStep(row)

    // console.log("GET APP ENTRY PROCEDURE: ", { step })

    if (row && step) return { kind: "onboarding", step }

    let organizations: Awaited<ReturnType<typeof auth.api.listOrganizations>>

    try {
      organizations = await auth.api.listOrganizations({
        headers: new Headers(context.request.headers as HeadersInit),
      })
    } catch (error) {
      rethrowORPCError(error)

      if (error instanceof Error && error.message === "Not authenticated") {
        throw errors.UNAUTHORIZED({
          message: "Authentication required",
        })
      }

      console.error("Failed to resolve app entry organizations", error)

      throw errors.INTERNAL_SERVER_ERROR({
        message: "Unable to resolve app entry.",
      })
    }

    // console.log("GET APP ENTRY PROCEDURE: ", { organizations })
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

    // console.log("getOnboardingState", { row })

    const workspace = row?.organizationId
      ? await prisma.organization.findUnique({
          where: {
            id: row.organizationId,
          },
          select: {
            id: true,
            name: true,
          },
        })
      : null

    // console.log("getOnboardingState workspace", { workspace })

    return {
      user: context.user,
      state: {
        workspaceId: row?.organizationId ?? null,
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
    await prisma.user.update({
      where: { id: context.user.id },
      data: {
        name: input.name,
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
  .output(onboardingWorkspaceCreationResultSchema)
  .handler(async ({ context, input, errors }) => {
    let creationResult: WorkspaceCreationResult

    try {
      creationResult = await createWorkspaceWithSetup({
        organizationName: input.name,
        userId: context.user.id,
        headers: new Headers(context.request.headers as HeadersInit),
      })
    } catch (error) {
      rethrowORPCError(error)

      if (
        error instanceof Error &&
        (error.message ===
          BETTER_AUTH_ORGANIZATION_ERRORS.ORGANIZATION_ALREADY_EXISTS ||
          error.message ===
            BETTER_AUTH_ORGANIZATION_ERRORS.ORGANIZATION_SLUG_ALREADY_TAKEN ||
          error.message === BETTER_AUTH_ORGANIZATION_ERRORS.SLUG_TAKEN_LEGACY)
      )
        throw errors.BAD_REQUEST({
          message: "A workspace with that name already exists.",
        })

      if (
        error instanceof Error &&
        error.message === BETTER_AUTH_ORGANIZATION_ERRORS.CREATE_FORBIDDEN
      ) {
        throw errors.FORBIDDEN({
          message: "You do not have permission to create a workspace",
        })
      }

      if (
        error instanceof Error &&
        error.message ===
          BETTER_AUTH_ORGANIZATION_ERRORS.ORGANIZATION_LIMIT_REACHED
      ) {
        throw errors.FORBIDDEN({
          message: "You have reached the maximum number of workspaces.",
        })
      }

      console.error("Failed to create onboarding workspace", error)

      throw errors.INTERNAL_SERVER_ERROR({
        message: "Failed to create workspace.",
      })
    }

    let onboardingStateSaved = false

    try {
      await prisma.onboardingState.upsert({
        where: {
          userId: context.user.id,
        },
        create: {
          userId: context.user.id,
          organizationId: creationResult.workspaceId,
          hasCompletedProfile: true,
          hasCreatedWorkspace: true,
          currentStep: "invite",
        },
        update: {
          organizationId: creationResult.workspaceId,
          hasCompletedProfile: true,
          hasCreatedWorkspace: true,
          currentStep: "invite",
        },
      })

      onboardingStateSaved = true
    } catch (error) {
      console.error("Failed to persist onboarding workspace state", error)
    }

    return toOnboardingWorkspaceResult({
      creationResult,
      onboardingStateSaved,
    })
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
  .output(onboardingInviteSubmitResultSchema)
  .handler(async ({ context, input, errors }) => {
    const workspace = await getOnboardingWorkspace(context.user.id)

    if (!workspace) {
      throw errors.FORBIDDEN({ message: "No onboarding workspace found" })
    }

    const headers = new Headers(context.request.headers as HeadersInit)

    let inviteResult: WorkspaceInviteMembersResult

    try {
      inviteResult = await inviteWorkspaceMembers({
        workspaceId: workspace.id,
        requesterEmail: context.user.email,
        emails: input.emails,
        headers,
      })
    } catch (error) {
      rethrowORPCError(error)

      if (
        error instanceof Error &&
        error.message === BETTER_AUTH_ORGANIZATION_ERRORS.ORGANIZATION_NOT_FOUND
      ) {
        throw errors.NOT_FOUND({
          message: "Onboarding workspace not found",
        })
      }

      if (
        error instanceof Error &&
        (error.message === BETTER_AUTH_ORGANIZATION_ERRORS.USER_NOT_MEMBER ||
          error.message === BETTER_AUTH_ORGANIZATION_ERRORS.INVITE_FORBIDDEN)
      ) {
        throw errors.FORBIDDEN({
          message: "No onboarding workspace found",
        })
      }

      console.error("Failed to process onboarding invitations", error)

      throw errors.INTERNAL_SERVER_ERROR({
        message: "Unable to process onboarding invitations.",
      })
    }

    const nextStep = inviteResult.invitedCount > 0 ? "billing" : "invite"

    if (inviteResult.invitedCount > 0) {
      await prisma.$transaction([
        prisma.organization.update({
          where: {
            id: workspace.id,
          },
          data: {
            metadata: mergeMetadata(workspace.metadata, {
              onboarding: {
                invitedCount: inviteResult.invitedCount,
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
      ...inviteResult,
      nextStep,
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

    await activateWorkspaceFreePlan(workspace.id)

    await prisma.onboardingState.update({
      where: {
        userId: context.user.id,
      },
      data: {
        hasCompletedBilling: true,
        currentStep: null,
      },
    })

    return {
      workspaceId: workspace.id,
      redirectTo: `/workspace/${workspace.id}`,
    }
  })

export const startOnboardingProPlan = base
  .use(requiredAuthMiddleware)
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .route({
    method: "POST",
    path: "/onboarding/billing/pro/start",
    summary: "Start paid onboarding with workspace checkout",
    tags: ["onboarding"],
  })
  .input(z.void())
  .output(z.object({ url: z.string() }))
  .handler(async ({ context, errors }) => {
    const workspace = await getOnboardingWorkspace(context.user.id)

    if (!workspace) {
      throw errors.FORBIDDEN({
        message: "No onboarding workspace found",
      })
    }

    return createWorkspaceCheckoutSession({
      workspaceId: workspace.id,
      initiatedByUserId: context.user.id,
      successUrl: `${process.env.BETTER_AUTH_URL}/onboarding/success`,
      returnUrl: `${process.env.BETTER_AUTH_URL}/onboarding/billing`,
    })
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

    const billing = await confirmWorkspaceProPlan(workspace.id)

    if (!billing || billing.plan !== "pro") {
      throw errors.BAD_REQUEST({
        message: "No active Polar subscription found",
      })
    }

    await prisma.onboardingState.update({
      where: { userId: context.user.id },
      data: {
        hasCompletedBilling: true,
        currentStep: null,
      },
    })

    return {
      workspaceId: workspace.id,
      redirectTo: `/workspace/${workspace.id}`,
    }
  })
