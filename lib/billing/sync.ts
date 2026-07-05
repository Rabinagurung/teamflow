import prisma from "@/lib/db"
import {
  ensureOrganizationBillingRow,
  organizationExists,
} from "./organization-billing.repository"
import { polarClient } from "./polar"
import { POLAR_PRODUCT_IDS } from "./polar-products"

/**
sync.ts is correctly responsible for webhook sync. 
It checks the org exists first, 
then reads active Polar subscriptions for externalCustomerId: organizationId, 
then projects that into organization_billing.
 */
export async function syncOrganizationBillingFromPolar(organizationId: string) {
  const exists = await organizationExists(organizationId)
  if (!exists) {
    return
  }

  //   console.log("SyncOrganizationBillingFromPolar: ");
  await ensureOrganizationBillingRow(organizationId)

  const iterator = await polarClient.subscriptions.list({
    externalCustomerId: organizationId,
    active: true,
    limit: 50,
  })

  /**
  {
  iterator: {
    result: { items: [Array], pagination: [Object] },
    next: [Function (anonymous)],
    '~next': undefined,
    Symbol(Symbol.asyncIterator): [AsyncGeneratorFunction: paginator]
  }
}
 */
  console.log({ iterator })

  console.log("iterator Result ITEMS: ", iterator.result.items)
  const subscriptions = []

  for await (const page of iterator) {
    subscriptions.push(...page.result.items)
  }

  console.log({ subscriptions })
  const activePro = subscriptions.find(
    (sub) => sub.productId === POLAR_PRODUCT_IDS.pro,
  )
  console.log({ activePro })

  if (!activePro) {
    return prisma.organizationBilling.update({
      where: { organizationId },
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

  return prisma.organizationBilling.update({
    where: { organizationId },
    data: {
      plan: "pro",
      status: activePro.cancelAtPeriodEnd ? "trailing" : "active",
      polarSubscriptionId: activePro.id,
      polarProductId: activePro.productId,
      currentPeriodEnd: activePro.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: activePro.cancelAtPeriodEnd ?? false,
      updatedAt: new Date(),
    },
  })
}
