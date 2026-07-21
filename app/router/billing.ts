import { z } from "zod"
import { readSecurityMiddleware } from "../middlewares/arcjet/read"
import { standardSecurityMiddleware } from "../middlewares/arcjet/standard"
import { requiredAuthMiddleware } from "../middlewares/auth"
import { base } from "../middlewares/base"
import { requiredWorkspaceMiddleware } from "../middlewares/workspace"
import {
  createOrganizationCheckout,
  createOrganizationPortalSession,
  getOrganizationBillingState,
} from "@/lib/billing/service"
import { writeSecurityMiddleware } from "../middlewares/arcjet/write"
import { canManageOrganizationBilling } from "@/lib/billing/guards"

const workspaceBillingInputSchema = z.object({
  workspaceId: z.string(),
})

const workspaceBillingOutputSchema = z.object({
  organizationId: z.string(),
  plan: z.enum(["free", "pro"]),
  status: z.enum(["free", "active", "trailing", "canceled"]),
  currentPeriodEnd: z.string().nullable(),
  cancelAtPeriodEnd: z.boolean(),
})

const workspaceBillingActionOutputSchema = z.object({
  url: z.string(),
})

async function hasBillingManagerAccess({
  workspaceId,
  userId,
}: {
  workspaceId: string
  userId: string
}) {
  return canManageOrganizationBilling({
    organizationId: workspaceId,
    userId,
  })
}

export const getWorkspaceBilling = base
  .use(requiredAuthMiddleware)
  .use(requiredWorkspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .route({
    method: "GET",
    path: "/billing",
    summary: "Get workspace billing",
    tags: ["billing"],
  })
  .input(workspaceBillingInputSchema)
  .output(workspaceBillingOutputSchema)
  .handler(async ({ context, input, errors }) => {
    if (context.workspace.id !== input.workspaceId) {
      throw errors.FORBIDDEN({
        message: "NO_WORKSPACE",
      })
    }

    const billing = await getOrganizationBillingState(context.workspace.id)

    return {
      organizationId: billing.organizationId,
      plan: billing.plan,
      status: billing.status,
      currentPeriodEnd: billing.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: billing.cancelAtPeriodEnd,
    }
  })

export const createWorkspaceCheckout = base
  .use(requiredAuthMiddleware)
  .use(requiredWorkspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .route({
    method: "POST",
    path: "/billing/checkout",
    summary: "Create workspace checkout session",
    tags: ["billing"],
  })
  .input(workspaceBillingInputSchema)
  .output(workspaceBillingActionOutputSchema)
  .handler(async ({ context, input, errors }) => {
    if (context.workspace.id !== input.workspaceId) {
      throw errors.FORBIDDEN({
        message: "NO_WORKSPACE",
      })
    }

    const canManageBilling = await hasBillingManagerAccess({
      workspaceId: context.workspace.id,
      userId: context.user.id,
    })

    if (!canManageBilling) {
      throw errors.FORBIDDEN({
        message: "WORKSPACE_BILLING_MANAGER_REQUIRED",
      })
    }

    try {
      return await createOrganizationCheckout({
        organizationId: context.workspace.id,
        initiatedByUserId: context.user.id,
      })
    } catch (error) {
      console.error("Failed to create workspace checkout", error)

      throw errors.INTERNAL_SERVER_ERROR({
        message: "Failed to start checkout",
      })
    }
  })

export const createWorkspacePortal = base
  .use(requiredAuthMiddleware)
  .use(requiredWorkspaceMiddleware)
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .route({
    method: "POST",
    path: "/billing/portal",
    summary: "Create workspace billing portal session",
    tags: ["billing"],
  })
  .input(workspaceBillingInputSchema)
  .output(workspaceBillingActionOutputSchema)
  .handler(async ({ context, input, errors }) => {
    if (context.workspace.id !== input.workspaceId) {
      throw errors.FORBIDDEN({
        message: "NO_WORKSPACE",
      })
    }
    const canManageBilling = await hasBillingManagerAccess({
      workspaceId: context.workspace.id,
      userId: context.user.id,
    })

    if (!canManageBilling) {
      throw errors.FORBIDDEN({
        message: "WORKSPACE_BILLING_MANAGER_REQUIRED",
      })
    }
    try {
      return await createOrganizationPortalSession({
        organizationId: context.workspace.id,
        externalMemberId: context.user.id,
      })
    } catch (error) {
      console.error("Failed to create workspace billing portal session", error)

      throw errors.INTERNAL_SERVER_ERROR({
        message: "Failed to open billing portal",
      })
    }
  })
