import { z } from "zod"

export const inviteEmailSchema = z
  .email("Enter a valid email address")
  .trim()
  .toLowerCase()

export const workspaceInviteFailureReasonSchema = z.enum([
  "permission_denied",
  "workspace_not_found",
  "invite_limit_reached",
  "already_member",
  "already_invited",
  "unknown",
])

export const workspaceInviteMembersResultSchema = z.object({
  invitedCount: z.number(),
  invitedEmails: z.array(z.string()),
  existingMemberEmails: z.array(z.string()),
  alreadyInvitedEmails: z.array(z.string()),
  selfEmails: z.array(z.string()),
  failedEmails: z.array(z.string()),
  failedInvitations: z.array(
    z.object({
      email: z.string(),
      reason: workspaceInviteFailureReasonSchema,
    }),
  ),
})

export type WorkspaceInviteFailureReason = z.infer<
  typeof workspaceInviteFailureReasonSchema
>

export type WorkspaceInviteMembersResult = z.infer<
  typeof workspaceInviteMembersResultSchema
>
