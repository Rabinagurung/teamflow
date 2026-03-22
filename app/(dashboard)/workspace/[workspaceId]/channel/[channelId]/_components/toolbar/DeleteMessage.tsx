import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Trash } from "lucide-react"
import React from "react"

const DeleteMessage = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" onClick={() => {}}>
          <Trash className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Are you sure you want to delete messsage ?</DialogTitle>
          <DialogDescription>
            Once deleted it cannot be undone
          </DialogDescription>
          <div className="flex justify-end gap-3">
            <Button variant="destructive">Cancel</Button>
            <Button variant="outline">Delete</Button>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteMessage
