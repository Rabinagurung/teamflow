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

    const invitedEmails: string[] = []
    const failedEmails: string[] = []
    let firstErrorMessage: string | null = null

    try {
      for (const email of emails) {
        try {
          await inviteMutation.mutateAsync({
            email,
            role: "member",
          })

          invitedEmails.push(email)
        } catch (error) {
          failedEmails.push(email)

          if (!firstErrorMessage) {
            firstErrorMessage = getErrorMessage(error)
          }
        }
      }

      if (invitedEmails.length > 0) {
        toast.success(
          `${invitedEmails.length} invitation${invitedEmails.length > 1 ? "s" : ""} sent`,
        )

        setOpen(false)
        await onSuccess?.()
      }

      if (failedEmails.length > 0) {
        if (failedEmails.length === 1 && invitedEmails.length === 0) {
          toast.error(firstErrorMessage ?? "Unable to send invitation")
          return
        }

        const preview = failedEmails.slice(0, 3).join(", ")
        const suffix = failedEmails.length > 3 ? "..." : ""

        toast.error(`Failed to invite: ${preview}${suffix}`)
      }
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
