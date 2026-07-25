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
import { applyInviteFeedback } from "./apply-invite-feedback"
import { isDefinedError } from "@orpc/client"

interface WorkspaceInviteMembersDialogProps {
  trigger: ReactElement
  onSuccess?: () => void | Promise<void>
}

export function WorkspaceInviteMembersDialog({
  trigger,
  onSuccess,
}: WorkspaceInviteMembersDialogProps) {
  const [open, setOpen] = useState(false)

  const inviteMutation = useMutation(
    orpc.member.invite.mutationOptions({
      onSuccess: async (result) => {
        applyInviteFeedback(result)

        if (result.invitedCount > 0) {
          setOpen(false)
          await onSuccess?.()
        }
      },

      onError: (error) => {
        toast.error(
          isDefinedError(error) ? error.message : "Unable to send invitations",
        )
      },
    }),
  )

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
          onSubmit={(values) => inviteMutation.mutate(values)}
          isPending={inviteMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  )
}
