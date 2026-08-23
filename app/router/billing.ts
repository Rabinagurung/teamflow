import { canManageWorkspaceBilling } from "@/lib/billing/guards"
import { GuestBillingNotAllowedError } from "@/lib/billing/polar-customer.service"
import {
  createWorkspaceCheckoutSession,
  createWorkspacePortalSession,
  getWorkspaceBillingState,
} from "@/lib/billing/workspace-billing.service"
import { z } from "zod"
import { readSecurityMiddleware } from "../middlewares/arcjet/read"
import { standardSecurityMiddleware } from "../middlewares/arcjet/standard"
import { writeSecurityMiddleware } from "../middlewares/arcjet/write"
import { requiredAuthMiddleware } from "../middlewares/auth"
import { base } from "../middlewares/base"
import { requiredWorkspaceMiddleware } from "../middlewares/workspace"

const workspaceBillingInputSchema = z.object({
  workspaceId: z.string(),
})

const workspaceBillingOutputSchema = z.object({
  workspaceId: z.string(),
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
  return canManageWorkspaceBilling({
    workspaceId,
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

    const billing = await getWorkspaceBillingState(context.workspace.id)

    return {
      workspaceId: context.workspace.id,
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
      return await createWorkspaceCheckoutSession({
        workspaceId: context.workspace.id,
        initiatedByUserId: context.user.id,
      })
    } catch (error) {
      if (error instanceof GuestBillingNotAllowedError) {
        throw errors.FORBIDDEN({ message: error.message })
      }

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
      return await createWorkspacePortalSession({
        workspaceId: context.workspace.id,
        externalMemberId: context.user.id,
      })
    } catch (error) {
      console.error("Failed to create workspace billing portal session", error)

      throw errors.INTERNAL_SERVER_ERROR({
        message: "Failed to open billing portal",
      })
    }
  })
