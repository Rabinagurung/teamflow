import { workspaceMemberRoleSchema } from "@/app/schemas/workspace"
import prisma from "@/lib/db"

/** Goal: restrict billing actions to org owner/admin.
 *
 *
 * Add a requireBillingManager(workspaceId) helper.
 * Use BetterAuth session lookup on the server.
 * Verify the signed-in user is a member of the org.
 * Verify the role is owner or admin.
 * 
 * Acceptance:

Billing actions cannot be run by non-members.
Billing actions cannot be run by regular members.
The helper returns the session/user for later service methods.

 */
type WorkspaceAccessParams = {
  workspaceId: string
  userId: string
}

export async function getWorkspaceMemberRole({
  workspaceId,
  userId,
}: WorkspaceAccessParams) {
  const membership = await prisma.member.findUnique({
    where: {
      organizationId_userId: {
        organizationId: workspaceId,
        userId,
      },
    },
    select: {
      role: true,
    },
  })

  if (!membership) {
    return null
  }

  const roleResult = workspaceMemberRoleSchema.safeParse(membership.role)

  if (!roleResult.success) {
    return null
  }

  return roleResult.data
}

export async function canManageWorkspaceBilling(params: WorkspaceAccessParams) {
  const role = await getWorkspaceMemberRole(params)

  return role === "owner" || role === "admin"
}
