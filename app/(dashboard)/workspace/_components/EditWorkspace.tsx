"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { updateWorkspaceSchema } from "@/app/schemas/workspace"
import { orpc } from "@/lib/orpc/orpc"
import { isDefinedError } from "@orpc/client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { startTransition, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { z } from "zod"

type EditWorkspaceProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EditWorkspace = ({ open, onOpenChange }: EditWorkspaceProps) => {
  const queryClient = useQueryClient()
  const router = useRouter()

  const form = useForm<z.infer<typeof updateWorkspaceSchema>>({
    resolver: zodResolver(updateWorkspaceSchema),
    defaultValues: {
      newWorkspaceName: "",
    },
  })

  useEffect(() => {
    if (!open) {
      form.reset()
    }
  }, [form, open])

  const updateWorkspaceMutation = useMutation(
    orpc.workspace.update.mutationOptions({
      onSuccess: (newWorkspace) => {
        toast.success(
          `Workspace updated ${newWorkspace.workspaceName} successfully`,
        )

        form.reset()
        onOpenChange(false)

        startTransition(() => {
          router.refresh()
        })

        void queryClient.invalidateQueries({
          queryKey: orpc.workspace.list.queryKey(),
        })
      },

      onError: (error) => {
        if (isDefinedError(error)) {
          toast.error(error.message)
          return
        }

        toast.error("Failed to update workspace, try again!")
      },
    }),
  )

  function onSubmit(values: z.infer<typeof updateWorkspaceSchema>) {
    updateWorkspaceMutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit workspace</DialogTitle>
          <DialogDescription>Edit the workspace name</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="newWorkspaceName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Workspace" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button disabled={updateWorkspaceMutation.isPending} type="submit">
              {updateWorkspaceMutation.isPending ? "Edit..." : "Edit Workspace"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default EditWorkspace
