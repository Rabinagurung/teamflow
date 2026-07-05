import { auth } from "@/lib/auth/auth"
import prisma from "@/lib/db"
import { headers } from "next/headers"

/** Goal: restrict billing actions to org owner/admin.
 *
 *
 * Add a requireBillingManager(organizationId) helper.
 * Use BetterAuth session lookup on the server.
 * Verify the signed-in user is a member of the org.
 * Verify the role is owner or admin.
 * 
 * Acceptance:

Billing actions cannot be run by non-members.
Billing actions cannot be run by regular members.
The helper returns the session/user for later service methods.

 */
export async function requireOrganizationMember(organizationId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error("Unauthorized")

  const membership = await prisma.member.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: session.user.id,
      },
    },
  })

  if (!membership) {
    throw new Error("Forbidden")
  }

  return { session, membership }
}

export async function requireOrganizationBillingManager(
  organizationId: string,
) {
  const { session, membership } =
    await requireOrganizationMember(organizationId)

  console.log(session, membership)

  if (!["owner", "admin"].includes(membership.role)) {
    throw new Error("Forbidden")
  }

  return session
}
