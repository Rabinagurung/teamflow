"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface SkipInviteDialogProps {
  onConfirm: () => void
  disabled?: boolean
}

const SkipInviteDialog = ({ onConfirm, disabled }: SkipInviteDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="link"
          className="text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          Skip this step
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Skip without inviting ?</DialogTitle>
          <DialogDescription>
            You can always invite teammates later from inside the workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-3 pt-4">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button disabled={disabled} onClick={onConfirm}>
              Skip Step
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SkipInviteDialog
