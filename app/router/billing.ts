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
    summary: "Create worksapce checkout session",
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

    try {
      return await createOrganizationCheckout(context.workspace.id)
    } catch (error) {
      if (error instanceof Error && error.message === "Unauthorized") {
        throw errors.UNAUTHORIZED()
      }

      if (error instanceof Error && error.message === "Forbidden") {
        throw errors.FORBIDDEN({
          message: "WORKSPACE_BILLING_MANAGER_REQUIRED",
        })
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

    try {
      return await createOrganizationPortalSession(context.workspace.id)
    } catch (error) {
      if (error instanceof Error && error.message === "Unauthorized") {
        throw errors.UNAUTHORIZED()
      }

      if (error instanceof Error && error.message === "Forbidden") {
        throw errors.FORBIDDEN({
          message: "WORKSPACE_BILLING_MANAGER_REQUIRED",
        })
      }

      console.error("Failed to create workspace billing portal session", error)

      throw errors.INTERNAL_SERVER_ERROR({
        message: "Failed to open billing portal",
      })
    }
  })
