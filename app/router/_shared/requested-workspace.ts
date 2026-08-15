import prisma from "@/lib/db"

export async function resolveRequestedWorkspaceId({
  activeWorkspaceId,
  onForbidden,
  requestedWorkspaceId,
  userId,
}: {
  activeWorkspaceId: string
  onForbidden: () => never
  requestedWorkspaceId?: string
  userId: string
}) {
  if (!requestedWorkspaceId || requestedWorkspaceId === activeWorkspaceId) {
    return activeWorkspaceId
  }

  const membership = await prisma.member.findUnique({
    where: {
      organizationId_userId: {
        organizationId: requestedWorkspaceId,
        userId,
      },
    },
    select: {
      id: true,
    },
  })

  if (!membership) {
    onForbidden()
  }

  return requestedWorkspaceId
}
