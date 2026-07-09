import prisma from "@/lib/db"
import {
  ensureOrganizationBillingRow,
  updateOrganizationBillingCustomer,
} from "./organization-billing.repository"
import { polarClient } from "./polar"

/**
 polar-customer.ts owns Polar team customer creation/recovery. 
 That is the right place for the tricky logic. 
 It checks the local billing row first, then checks Polar by externalId = organizationId, 
 then creates the team customer only if needed. That matches your Slack-style model.
 */
function getErrorStatusCode(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
  ) {
    return error.statusCode
  }

  return null
}

function isPolarNotFoundError(error: unknown) {
  return getErrorStatusCode(error) === 404
}
//check if polar customer of this org already created in polar or not.
async function getPolarTeamCustomerByExternalId(organizationId: string) {
  try {
    return await polarClient.customers.getExternal({
      externalId: organizationId,
    })
  } catch (error) {
    if (isPolarNotFoundError(error)) {
      return null
    }

    throw error
  }
}

async function getOrganizationOwner(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
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

  if (!org) {
    throw new Error("Organization not found")
  }

  const owner = org.members[0]?.user

  if (!owner) {
    throw new Error("Organization owner not found")
  }

  return { org, owner }
}

export async function ensurePolarTeamCustomer(organizationId: string) {
  console.log("ensurePolarTeamCustomer called ")
  const billing = await ensureOrganizationBillingRow(organizationId)

  /**
        ensureOrganizationBillingRow billing:   {
            billing: {
                organizationId: 'qfAmXwAocaP92EZlMzT1rllhkwoDUoW5',
                plan: 'free',
                status: 'free',
                polarCustomerId: null,
                polarCustomerExternalId: 'qfAmXwAocaP92EZlMzT1rllhkwoDUoW5',
                polarSubscriptionId: null,
                polarProductId: null,
                billingManagerUserId: null,
                currentPeriodEnd: null,
                cancelAtPeriodEnd: false,
                createdAt: 2026-06-04T19:49:14.917Z,
                updatedAt: 2026-06-04T19:49:14.917Z
            }
        }

    */
  // console.log("ensureOrganizationBillingRow billing:  ", { billing })

  if (billing?.polarCustomerId) {
    return billing
  }

  const existingPolarCustomer =
    await getPolarTeamCustomerByExternalId(organizationId)

  //console.log("getPolarTeamCustomerByExternalId : ", { existingPolarCustomer })

  //If polar customer using orgId has already been created then upgrade the org-billing row.
  if (existingPolarCustomer) {
    return updateOrganizationBillingCustomer({
      organizationId,
      polarCustomerId: existingPolarCustomer.id,
    })
  }

  //if polar customer for this orgId has not been created yet then create new polar customer using orgId
  const { org, owner } = await getOrganizationOwner(organizationId)
  //console.log("getOrganizationOwner: ", { org, owner })

  try {
    const customer = await polarClient.customers.create({
      type: "team",
      externalId: org.id,
      name: org.name,
      owner: {
        email: owner.email,
        name: owner.name,
        externalId: owner.id,
      },
    })

    return updateOrganizationBillingCustomer({
      organizationId,
      polarCustomerId: customer.id,
    })
  } catch (error) {
    const recoverdCustomer =
      await getPolarTeamCustomerByExternalId(organizationId)

    //console.log({ recoverdCustomer })

    if (recoverdCustomer) {
      return updateOrganizationBillingCustomer({
        organizationId,
        polarCustomerId: recoverdCustomer.id,
      })
    }

    throw error
  }
}
