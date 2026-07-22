import "server-only"

import { syncWorkspaceBillingFromPolar } from "./billing-sync.service"
import { ensurePolarTeamCustomer } from "./polar-customer.service"
import { POLAR_PRODUCT_IDS } from "./polar-products"
import { polarClient } from "./polar.gateway"
import {
  ensureWorkspaceBillingRow,
  setWorkspaceBillingFreeState,
  updateWorkspaceBillingManager,
} from "./workspace-billing.repository"

/**
 service.ts is correctly acting as the orchestration layer. 
 It does not own low-level DB details anymore. 
 
 Checkout flow is clean: require owner/admin,
 ensure team customer, create checkout for externalCustomerId: workspaceId, 
 store billingManagerUserId, return checkout URL.
 */
export async function getWorkspaceBillingState(workspaceId: string) {
  return ensureWorkspaceBillingRow(workspaceId)
}

export async function activateWorkspaceFreePlan(workspaceId: string) {
  await ensureWorkspaceBillingRow(workspaceId)
  return setWorkspaceBillingFreeState(workspaceId)
}

export async function confirmWorkspaceProPlan(workspaceId: string) {
  const syncedBilling = await syncWorkspaceBillingFromPolar(workspaceId)

  if (syncedBilling?.plan === "pro") {
    return syncedBilling
  }

  const latestBilling = await getWorkspaceBillingState(workspaceId)

  return latestBilling.plan === "pro" ? latestBilling : null
}

export async function createWorkspaceCheckoutSession({
  workspaceId,
  initiatedByUserId,
  successUrl,
  returnUrl,
}: {
  workspaceId: string
  initiatedByUserId: string
  successUrl?: string
  returnUrl?: string
}) {
  //Enusres polar team customer exists -> returns orgBilligRow with polar.customer.id.
  //Or creates new polar team customer for this orgId -> Updates -> returns orgBilligRow with polar customer Id
  // const orgBillingRowAfterPolarTeamCustomer =
  await ensurePolarTeamCustomer(workspaceId)

  const billing = await syncWorkspaceBillingFromPolar(workspaceId)

  const resolvedSuccessUrl =
    successUrl ??
    `${process.env.BETTER_AUTH_URL}/admin/${workspaceId}/billing?checkout=success`

  const resolvedReturnUrl =
    returnUrl ?? `${process.env.BETTER_AUTH_URL}/admin/${workspaceId}/billing`

  if (billing?.plan === "pro") {
    return {
      url: resolvedSuccessUrl,
    }
  }

  /** Create a payment page for this org to buy Pro
  Not: Mark this org as Pro

   At this moment: await polarClient.checkouts.create(): 
    -> Polar has created a checkout URL.
    -> The checkout is associated with the org customer using externalCustomerId: workspaceId.
    -> The product being offered is Pro because of products: [POLAR_PRODUCT_IDS.pro].
    -> The user has not paid yet.
    -> Your local organization_billing.plan should still be free.

    The org becomes pro only after:
    user opens checkout URL
    -> user completes payment/subscription in Polar
    -> Polar creates/activates subscription
    -> Polar sends webhook to your app
    -> syncOrganizationBillingFromPolar(workspaceId) runs
    -> your DB updates organization_billing.plan = "pro"
   */
  const checkout = await polarClient.checkouts.create({
    externalCustomerId: workspaceId,
    products: [POLAR_PRODUCT_IDS.pro],
    successUrl: resolvedSuccessUrl,
    returnUrl: resolvedReturnUrl,
    metadata: {
      workspaceId,
      initiatedByUserId,
    },
  })

  //Updates orgBilligRow with billingManagerUserId = userId
  await updateWorkspaceBillingManager({
    workspaceId,
    userId: initiatedByUserId,
  })

  return { url: checkout.url }
}

export async function createWorkspacePortalSession({
  workspaceId,
  externalMemberId,
}: {
  workspaceId: string
  externalMemberId: string
}) {
  const billing = await ensurePolarTeamCustomer(workspaceId)

  if (!billing?.polarCustomerId) {
    throw new Error("Polar customer not found")
  }

  /**
  For a team customer portal session, Polar may need to know:
    Which customer?
    Which member/user inside that customer?
   */
  const customerSession = await polarClient.customerSessions.create({
    customerId: billing.polarCustomerId,
    externalMemberId,
    returnUrl: `${process.env.BETTER_AUTH_URL}/admin/${workspaceId}/billing?portal=return`,
  })

  return { url: customerSession.customerPortalUrl }
}
