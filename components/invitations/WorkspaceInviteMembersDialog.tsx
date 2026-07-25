"use client"

import { WorkspaceInviteMembersForm } from "@/components/invitations/WorkspaceInviteMembersForm"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { orpc } from "@/lib/orpc/orpc"
import { useMutation } from "@tanstack/react-query"
import { type ReactElement, useState } from "react"
import { toast } from "sonner"

interface WorkspaceInviteMembersDialogProps {
  trigger: ReactElement
  onSuccess?: () => void | Promise<void>
}

type ErrorWithMessage = {
  message?: string
}

const getErrorMessage = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as ErrorWithMessage).message === "string"
  ) {
    return (error as ErrorWithMessage).message!
  }

  return null
}

export function WorkspaceInviteMembersDialog({
  trigger,
  onSuccess,
}: WorkspaceInviteMembersDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const inviteMutation = useMutation(orpc.member.invite.mutationOptions())

  const handleSubmit = async ({ emails }: { emails: string[] }) => {
    setIsSubmitting(true)

    try {
      const result = await inviteMutation.mutateAsync({ emails })

      if (result.invitedCount > 0) {
        toast.success(
          `${result.invitedCount} invitation${result.invitedCount > 1 ? "s" : ""} sent`,
        )

        setOpen(false)
        await onSuccess?.()
      }

      if (result.existingMemberEmails.length > 0) {
        toast.warning(
          `Already members: ${result.existingMemberEmails.slice(0, 3).join(", ")}`,
        )
      }

      if (result.alreadyInvitedEmails.length > 0) {
        toast.warning(
          `Already invited: ${result.alreadyInvitedEmails.slice(0, 3).join(", ")}`,
        )
      }

      if (result.selfEmails.length > 0) {
        toast.warning("You cannot invite yourself")
      }

      if (result.failedEmails.length > 0) {
        toast.error(`Failed: ${result.failedEmails.slice(0, 3).join(", ")}`)
      }
    } catch (error) {
      toast.error(getErrorMessage(error) ?? "Unable to send invitations")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-2xl p-10">
        <DialogHeader>
          <DialogTitle>Invite People</DialogTitle>
          <DialogDescription>
            Add one or more coworkers by email. Everyone invited here joins as a
            member.
          </DialogDescription>
        </DialogHeader>

        <WorkspaceInviteMembersForm
          onSubmit={handleSubmit}
          isPending={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  )
}
