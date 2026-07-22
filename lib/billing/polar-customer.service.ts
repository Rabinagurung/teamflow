import { polarClient } from "./polar.gateway"
import {
  ensureWorkspaceBillingRow,
  getWorkspaceOwnerForBilling,
  updateWorkspaceBillingCustomer,
} from "./workspace-billing.repository"

/**
 polar-customer.ts owns Polar team customer creation/recovery. 
 That is the right place for the tricky logic. 
 It checks the local billing row first, then checks Polar by externalId = workspaceId, 
 then creates the team customer only if needed. That matches your Slack-style model.
 */
function getErrorStatusCode(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof (error as { statusCode?: unknown }).statusCode === "number"
  ) {
    return (error as { statusCode: number }).statusCode
  }

  return undefined
}

function isPolarNotFoundError(error: unknown) {
  return getErrorStatusCode(error) === 404
}
//check if polar customer of this org already created in polar or not.
async function getPolarTeamCustomerByExternalId(workspaceId: string) {
  try {
    return await polarClient.customers.getExternal({
      externalId: workspaceId,
    })
  } catch (error) {
    if (isPolarNotFoundError(error)) {
      return null
    }

    throw error
  }
}

export async function ensurePolarTeamCustomer(workspaceId: string) {
  // console.log("ensurePolarTeamCustomer called ")
  const billing = await ensureWorkspaceBillingRow(workspaceId)

  // console.log("ensureOrganizationBillingRow billing:  ", { billing })

  if (billing.polarCustomerId) {
    return billing
  }

  const existingCustomer = await getPolarTeamCustomerByExternalId(workspaceId)

  //console.log("getPolarTeamCustomerByExternalId : ", { existingCustomer })

  //If polar customer using orgId has already been created then upgrade the org-billing row.
  if (existingCustomer) {
    return updateWorkspaceBillingCustomer({
      workspaceId,
      polarCustomerId: existingCustomer.id,
    })
  }

  //if polar customer for this orgId has not been created yet then create new polar customer using orgId
  const workspaceWithOwner = await getWorkspaceOwnerForBilling(workspaceId)
  //console.log("getOrganizationOwner: ", { org, owner })

  if (!workspaceWithOwner?.owner) {
    throw new Error("Workspace owner not found")
  }

  const { workspace, owner } = workspaceWithOwner

  try {
    const customer = await polarClient.customers.create({
      type: "team",
      externalId: workspace.id,
      name: workspace.name,
      owner: {
        email: owner.email,
        name: owner.name,
        externalId: owner.id,
      },
    })

    return updateWorkspaceBillingCustomer({
      workspaceId,
      polarCustomerId: customer.id,
    })
  } catch (error) {
    const recoverdCustomer = await getPolarTeamCustomerByExternalId(workspaceId)

    //console.log({ recoverdCustomer })

    if (recoverdCustomer) {
      return updateWorkspaceBillingCustomer({
        workspaceId,
        polarCustomerId: recoverdCustomer.id,
      })
    }

    throw error
  }
}
