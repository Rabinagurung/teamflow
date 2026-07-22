import { polarClient } from "./polar.gateway"
import { POLAR_PRODUCT_IDS } from "./polar-products"
import {
  ensureWorkspaceBillingRow,
  setWorkspaceBillingFreeState,
  setWorkspaceBillingProState,
  workspaceExists,
} from "./workspace-billing.repository"

/**
sync.ts is correctly responsible for webhook sync. 
It checks the org exists first, 
then reads active Polar subscriptions for externalCustomerId: workspaceId, 
then projects that into organization_billing.
 */
export async function syncWorkspaceBillingFromPolar(workspaceId: string) {
  const exists = await workspaceExists(workspaceId)
  if (!exists) {
    return
  }

  //   console.log("SyncOrganizationBillingFromPolar: ");
  await ensureWorkspaceBillingRow(workspaceId)

  const iterator = await polarClient.subscriptions.list({
    externalCustomerId: workspaceId,
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
  // console.log({ iterator })

  console.log("iterator Result ITEMS: ", iterator.result.items)
  const subscriptions = []

  for await (const page of iterator) {
    subscriptions.push(...page.result.items)
  }

  console.log({ subscriptions })
  const activeSubscription = subscriptions.find(
    (sub) => sub.productId === POLAR_PRODUCT_IDS.pro,
  )
  // console.log({ activeSubscription })

  if (!activeSubscription) {
    return setWorkspaceBillingFreeState(workspaceId)
  }

  return setWorkspaceBillingProState({
    workspaceId,
    subscriptionId: activeSubscription.id,
    productId: activeSubscription.productId,
    currentPeriodEnd: activeSubscription.currentPeriodEnd
      ? new Date(activeSubscription.currentPeriodEnd)
      : null,

    cancelAtPeriodEnd: activeSubscription?.cancelAtPeriodEnd ?? false,
  })
}
