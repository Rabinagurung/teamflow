import { BETTER_AUTH_ORGANIZATION_ERRORS } from "./better-auth-organization-errors"
import { auth } from "@/lib/auth/auth"
import prisma from "@/lib/db"
import {
  type WorkspaceInviteFailureReason,
  type WorkspaceInviteMembersResult,
} from "@/app/schemas/invitations"

const classifyWorkspaceInviteFailure = (
  error: unknown,
): WorkspaceInviteFailureReason => {
  if (!(error instanceof Error)) {
    return "unknown"
  }

  if (
    error.message === BETTER_AUTH_ORGANIZATION_ERRORS.INVITE_FORBIDDEN ||
    error.message === BETTER_AUTH_ORGANIZATION_ERRORS.USER_NOT_MEMBER
  ) {
    return "permission_denied"
  }

  if (
    error.message === BETTER_AUTH_ORGANIZATION_ERRORS.ORGANIZATION_NOT_FOUND
  ) {
    return "workspace_not_found"
  }

  if (
    error.message === BETTER_AUTH_ORGANIZATION_ERRORS.INVITATION_LIMIT_REACHED
  ) {
    return "invite_limit_reached"
  }

  if (error.message === BETTER_AUTH_ORGANIZATION_ERRORS.USER_ALREADY_MEMBER) {
    return "already_member"
  }

  if (error.message === BETTER_AUTH_ORGANIZATION_ERRORS.USER_ALREADY_INVITED) {
    return "already_invited"
  }

  return "unknown"
}

type InviteWorkspaceMembersParams = {
  workspaceId: string
  requesterEmail: string
  emails: string[]
  headers: Headers
}

export const inviteWorkspaceMembers = async ({
  workspaceId,
  requesterEmail,
  emails,
  headers,
}: InviteWorkspaceMembersParams): Promise<WorkspaceInviteMembersResult> => {
  const normalizedEmails = Array.from(
    new Set(
      emails
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email.length > 0),
    ),
  )

  const selfEmail = requesterEmail.trim().toLowerCase()

  const membersList = await auth.api.listMembers({
    query: {
      organizationId: workspaceId,
      sortBy: "createdAt",
      sortDirection: "desc",
    },
    headers,
  })

  if (!membersList.members) {
    throw new Error("Unable to load workspace members.")
  }

  const existingMemberEmails = new Set(
    membersList.members
      .map((member) => member.user.email?.trim().toLowerCase())
      .filter((email): email is string => Boolean(email)),
  )

  const pendingInvitations = await prisma.invitation.findMany({
    where: {
      organizationId: workspaceId,
      status: "pending",
      email: { in: normalizedEmails },
    },
    select: {
      email: true,
    },
  })

  const alreadyInvitedEmails = new Set(
    pendingInvitations.map((invitation) =>
      invitation.email.trim().toLowerCase(),
    ),
  )

  const selfEmails: string[] = []
  const blockedExistingMembers: string[] = []
  const blockedAlreadyInvited: string[] = []

  const sendableEmails = normalizedEmails.filter((email) => {
    if (email === selfEmail) {
      selfEmails.push(email)
      return false
    }

    if (existingMemberEmails.has(email)) {
      blockedExistingMembers.push(email)
      return false
    }

    if (alreadyInvitedEmails.has(email)) {
      blockedAlreadyInvited.push(email)
      return false
    }

    return true
  })

  if (sendableEmails.length === 0) {
    return {
      invitedCount: 0,
      invitedEmails: [],
      existingMemberEmails: blockedExistingMembers,
      alreadyInvitedEmails: blockedAlreadyInvited,
      selfEmails,
      failedEmails: [],
      failedInvitations: [],
    }
  }

  const results = await Promise.allSettled(
    sendableEmails.map((email) =>
      auth.api.createInvitation({
        body: {
          email,
          role: "member",
          organizationId: workspaceId,
        },
        headers,
      }),
    ),
  )

  const invitedEmails = results.flatMap((result, index) =>
    result.status === "fulfilled" ? [sendableEmails[index]!] : [],
  )

  const failedInvitations = results.flatMap((result, index) =>
    result.status === "rejected"
      ? [
          {
            email: sendableEmails[index]!,
            reason: classifyWorkspaceInviteFailure(result.reason),
          },
        ]
      : [],
  )

  return {
    invitedCount: invitedEmails.length,
    invitedEmails,
    existingMemberEmails: blockedExistingMembers,
    alreadyInvitedEmails: blockedAlreadyInvited,
    selfEmails,
    failedEmails: failedInvitations.map((item) => item.email),
    failedInvitations,
  }
}
