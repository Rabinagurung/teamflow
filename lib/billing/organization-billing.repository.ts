import prisma from "@/lib/db"

//This file owns the organization_billing table reads/writes.

export async function organizationExists(organizationId: string) {
  const existing = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true },
  })

  return Boolean(existing)
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
export async function ensureOrganizationBillingRow(organizationId: string) {
  // Creates the default free billing row if it does not exist.
  // Existing rows are left unchanged, including active Pro subscriptions.
  return prisma.organizationBilling.upsert({
    where: { organizationId },
    create: {
      organizationId,
      plan: "free",
      status: "free",
      polarCustomerExternalId: organizationId,
    },
    update: {},
  })

  /**
    Inside an async function is okay.

    Because async functions automatically resolve returned promises. So this:

    export async function ensureOrganizationBillingRow(organizationId: string) {
        return db.query.organizationBilling.findFirst(...);
    }
    behaves like:

    export async function ensureOrganizationBillingRow(organizationId: string) {
        return await db.query.organizationBilling.findFirst(...);
    }
 */
}

export async function updateOrganizationBillingCustomer(params: {
  organizationId: string
  polarCustomerId: string
}) {
  // await db
  //   .update(organizationBilling)
  //   .set({
  //     polarCustomerId: params.polarCustomerId,
  //     polarCustomerExternalId: params.organizationId,
  //     updatedAt: new Date(),
  //   })
  //   .where(eq(organizationBilling.organizationId, params.organizationId))

  return prisma.organizationBilling.update({
    where: { organizationId: params.organizationId },
    data: {
      polarCustomerId: params.polarCustomerId,
      polarCustomerExternalId: params.organizationId,
    },
  })

  // return db.query.organizationBilling.findFirst({
  //   where: eq(organizationBilling.organizationId, params.organizationId),
  // })
}

export async function updateOrganizationBillingManager(params: {
  organizationId: string
  userId: string
}) {
  return prisma.organizationBilling.update({
    where: { organizationId: params.organizationId },
    data: {
      billingManagerUserId: params.userId,
    },
  })
}
