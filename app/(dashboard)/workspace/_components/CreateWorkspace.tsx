"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { DialogDescription } from "@radix-ui/react-dialog"
import { Plus } from "lucide-react"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { workspaceSchema } from "@/app/schemas/workspace"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { orpc } from "@/lib/orpc/orpc"
import { toast } from "sonner"
import { isDefinedError } from "@orpc/client"

type CreateWorkspaceProps = {
  alwaysOpen?: boolean
}

const CreateWorkspace = ({ alwaysOpen }: CreateWorkspaceProps) => {
  const [open, setOpen] = useState(alwaysOpen ?? false)
  const queryClient = useQueryClient()

  const form = useForm<z.infer<typeof workspaceSchema>>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: "",
    },
  })

  const createWorkspaceMutation = useMutation(
    orpc.workspace.create.mutationOptions({
      onSuccess: (newWorkspace) => {
        toast.success(
          `Workspace ${newWorkspace.workspaceName} created successfully`,
        )

        //revalidate the data to fetch workspaces data that contains new workspace for UI
        /** ORPC generates query key using .queryKey()  */
        queryClient.invalidateQueries({
          queryKey: orpc.workspace.list.queryKey(),
        })

        form.reset()
        setOpen(false)
      },

      onError: (error) => {
        if (isDefinedError(error)) {
          if (error.code === "RATE_LIMITED") {
            toast.error(error.message)
            return
          }
          toast.error(error.message)
          return
        }
        toast.error("Failed to create workspace, try again!")
      },
    }),
  )

  function onSubmit(values: z.infer<typeof workspaceSchema>) {
    createWorkspaceMutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-12 rounded-xl border-2 border-dashed border-workspace-rail-border text-muted-foreground 
              transition-all duration-200 hover:rounded-lg hover:border-sidebar-ring hover:bg-workspace-rail-accent hover:text-foreground"
            >
              <Plus className="size-5" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Create Workspace</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
          <DialogDescription>
            Create a new workspace to get started
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
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
            <Button disabled={createWorkspaceMutation.isPending} type="submit">
              {createWorkspaceMutation.isPending
                ? "Creating..."
                : "Create Workspace"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateWorkspace
