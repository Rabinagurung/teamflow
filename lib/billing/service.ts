import "server-only"

import {
  ensureOrganizationBillingRow,
  updateOrganizationBillingManager,
} from "./organization-billing.repository"
import { polarClient } from "./polar"
import { ensurePolarTeamCustomer } from "./polar-customer"
import { POLAR_PRODUCT_IDS } from "./polar-products"
import { syncOrganizationBillingFromPolar } from "./sync"

/**
 service.ts is correctly acting as the orchestration layer. 
 It does not own low-level DB details anymore. 
 
 Checkout flow is clean: require owner/admin,
 ensure team customer, create checkout for externalCustomerId: organizationId, 
 store billingManagerUserId, return checkout URL.
 */
export async function getOrganizationBillingState(organizationId: string) {
  return ensureOrganizationBillingRow(organizationId)
}

type CreateOrganizationCheckoutParams = {
  organizationId: string
  initiatedByUserId: string
}

export async function createOrganizationCheckout({
  organizationId,
  initiatedByUserId,
}: CreateOrganizationCheckoutParams) {
  //Enusres polar team customer exists -> returns orgBilligRow with polar.customer.id.
  //Or creates new polar team customer for this orgId -> Updates -> returns orgBilligRow with polar customer Id
  // const orgBillingRowAfterPolarTeamCustomer =
  await ensurePolarTeamCustomer(organizationId)
  // console.log({ orgBillingRowAfterPolarTeamCustomer })
  // console.log("ensurePolarTeamCustomer passed")

  const billing = await syncOrganizationBillingFromPolar(organizationId)

  if (billing?.plan === "pro") {
    return {
      url: `${process.env.BETTER_AUTH_URL}/admin/${organizationId}/billing`,
    }
  }

  /** Create a payment page for this org to buy Pro
  Not: Mark this org as Pro

   At this moment: await polarClient.checkouts.create(): 
    -> Polar has created a checkout URL.
    -> The checkout is associated with the org customer using externalCustomerId: organizationId.
    -> The product being offered is Pro because of products: [POLAR_PRODUCT_IDS.pro].
    -> The user has not paid yet.
    -> Your local organization_billing.plan should still be free.

    The org becomes pro only after:
    user opens checkout URL
    -> user completes payment/subscription in Polar
    -> Polar creates/activates subscription
    -> Polar sends webhook to your app
    -> syncOrganizationBillingFromPolar(organizationId) runs
    -> your DB updates organization_billing.plan = "pro"
   */
  const checkout = await polarClient.checkouts.create({
    externalCustomerId: organizationId,
    products: [POLAR_PRODUCT_IDS.pro],
    successUrl: `${process.env.BETTER_AUTH_URL}/admin/${organizationId}/billing?checkout=success`,
    returnUrl: `${process.env.BETTER_AUTH_URL}/admin/${organizationId}/billing`,
    metadata: {
      organizationId,
      initiatedByUserId,
    },
  })

  //Updates orgBilligRow with billingManagerUserId = userId
  await updateOrganizationBillingManager({
    organizationId,
    userId: initiatedByUserId,
  })

  return { url: checkout.url }
}

type CreateOrganizationPortalSessionParams = {
  organizationId: string
  externalMemberId: string
}

export async function createOrganizationPortalSession({
  organizationId,
  externalMemberId,
}: CreateOrganizationPortalSessionParams) {
  const billing = await ensurePolarTeamCustomer(organizationId)

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
    returnUrl: `${process.env.BETTER_AUTH_URL}/admin/${organizationId}/billing?portal=return`,
  })

  return { url: customerSession.customerPortalUrl }
}
