import prisma from "@/lib/db"

//This file owns the organization_billing table reads/writes.
export async function workspaceExists(workspaceId: string) {
  const workspace = await prisma.organization.findUnique({
    where: { id: workspaceId },
    select: { id: true },
  })

  return Boolean(workspace)
}

/**
 * Why this service layer matters:

    ensureOrganizationBillingRow guarantees every org has a local free/pro state.
    ensurePolarTeamCustomer makes the organization the Polar customer, not the user.
    createOrganizationCheckout creates pro checkout for the org.
    createOrganizationPortalSession opens billing management for the org.
    syncOrganizationBillingFromPolar projects Polar state into your local source of truth.
    markWebhookProcessed prevents duplicate webhook processing.
 */
export async function ensureWorkspaceBillingRow(workspaceId: string) {
  // Creates the default free billing row if it does not exist.
  // Existing rows are left unchanged, including active Pro subscriptions.
  return prisma.organizationBilling.upsert({
    where: { organizationId: workspaceId },
    create: {
      organizationId: workspaceId,
      plan: "free",
      status: "free",
      polarCustomerExternalId: workspaceId,
    },
    update: {},
  })

  /**
    Inside an async function is okay.

    Because async functions automatically resolve returned promises. So this:

    export async function ensureOrganizationBillingRow(workspaceId: string) {
        return db.query.organizationBilling.findFirst(...);
    }
    behaves like:

    export async function ensureOrganizationBillingRow(workspaceId: string) {
        return await db.query.organizationBilling.findFirst(...);
    }
 */
}

export async function updateWorkspaceBillingCustomer({
  workspaceId,
  polarCustomerId,
}: {
  workspaceId: string
  polarCustomerId: string
}) {
  return prisma.organizationBilling.update({
    where: { organizationId: workspaceId },
    data: {
      polarCustomerId: polarCustomerId,
      polarCustomerExternalId: workspaceId,
    },
  })
}

export async function updateWorkspaceBillingManager({
  workspaceId,
  userId,
}: {
  workspaceId: string
  userId: string
}) {
  return prisma.organizationBilling.update({
    where: { organizationId: workspaceId },
    data: {
      billingManagerUserId: userId,
    },
  })
}

export async function getWorkspaceOwnerForBilling(workspaceId: string) {
  const workspace = await prisma.organization.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        where: { role: "owner" },
        include: {
          user: true,
        },
        take: 1,
      },
    },
  })

  if (!workspace) {
    return null
  }

  const owner = workspace.members[0]?.user ?? null

  return {
    workspace,
    owner,
  }
}

export async function setWorkspaceBillingFreeState(workspaceId: string) {
  return prisma.organizationBilling.update({
    where: { organizationId: workspaceId },
    data: {
      plan: "free",
      status: "free",
      polarSubscriptionId: null,
      polarProductId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      updatedAt: new Date(),
    },
  })
}

export async function setWorkspaceBillingProState({
  workspaceId,
  subscriptionId,
  productId,
  currentPeriodEnd,
  cancelAtPeriodEnd,
}: {
  workspaceId: string
  subscriptionId: string
  productId: string
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
}) {
  return prisma.organizationBilling.update({
    where: { organizationId: workspaceId },
    data: {
      plan: "pro",
      status: cancelAtPeriodEnd ? "trailing" : "active",
      polarSubscriptionId: subscriptionId,
      polarProductId: productId,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      updatedAt: new Date(),
    },
  })
}
