import { toast } from "sonner"

type InviteFeedbackResult = {
  invitedCount: number
  existingMemberEmails: string[]
  alreadyInvitedEmails: string[]
  selfEmails: string[]
  failedEmails: string[]
}

const formatInviteEmailPreview = (emails: string[], max = 3) => {
  const preview = emails.slice(0, max).join(", ")

  return emails.length > max ? `${preview}...` : preview
}

export const applyInviteFeedback = ({
  invitedCount,
  existingMemberEmails,
  alreadyInvitedEmails,
  selfEmails,
  failedEmails,
}: InviteFeedbackResult) => {
  if (invitedCount > 0) {
    toast.success(
      `${invitedCount} invitation${invitedCount === 1 ? "" : "s"} sent`,
    )
  }

  if (existingMemberEmails.length > 0) {
    toast.warning(
      `Already members: ${formatInviteEmailPreview(existingMemberEmails)}`,
    )
  }

  if (alreadyInvitedEmails.length > 0) {
    toast.warning(
      `Already invited: ${formatInviteEmailPreview(alreadyInvitedEmails)}`,
    )
  }

  if (selfEmails.length > 0) {
    toast.warning(
      selfEmails.length === 1
        ? "You cannot invite yourself."
        : "Some emails belong to you and were skipped.",
    )
  }

  if (failedEmails.length > 0) {
    toast.error(`Failed to invite: ${formatInviteEmailPreview(failedEmails)}`)
  }
}
