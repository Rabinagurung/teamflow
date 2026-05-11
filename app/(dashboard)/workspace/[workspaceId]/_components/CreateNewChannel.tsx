"use client"

import { ChannelNameSchema } from "@/app/schemas/channel"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useRequiredActiveWorkspace } from "@/hooks/use-active-workspace"
import { orpc } from "@/lib/orpc/orpc"
import { normalizeChannelName } from "@/lib/utlis/normalize-channel-name"
import { zodResolver } from "@hookform/resolvers/zod"
import { isDefinedError } from "@orpc/client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"

const CreateNewChannel = () => {
  const { workspacePath } = useRequiredActiveWorkspace()
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const router = useRouter()

  const form = useForm({
    resolver: zodResolver(ChannelNameSchema),
    defaultValues: {
      name: "",
    },
  })

  const createChannelMutation = useMutation(
    orpc.channel.create.mutationOptions({
      onSuccess: (newChannel) => {
        toast.success(`Channel ${newChannel.name} created Successfully!`)

        void queryClient.invalidateQueries({
          queryKey: orpc.channel.list.queryKey(),
        })

        form.reset()
        setOpen(false)

        router.push(`${workspacePath}/channel/${newChannel.id}`)
      },
      onError: (error) => {
        if (isDefinedError(error)) {
          toast.error(error.message)
          return
        }

        toast.error("Failed to create channel. Please try again")
      },
    }),
  )

  const onSubmit = (values: z.infer<typeof ChannelNameSchema>) => {
    createChannelMutation.mutate(values)
  }

  const watchedName = form.watch("name")
  const transformedName = watchedName ? normalizeChannelName(watchedName) : ""

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-white/15 bg-white/8 text-sidebar-foreground hover:bg-white/14 hover:text-white"
        >
          <Plus className="size-4" />
          Add Channel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
          <DialogDescription>
            Create New Channel to get started
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Channel" {...field} />
                  </FormControl>
                  {transformedName && transformedName !== watchedName && (
                    <p className="text-sm text-muted-foreground ">
                      Will be created as:{" "}
                      <code className="bg-muted px-1 py-0.5 rounded text-xs">
                        {transformedName}
                      </code>
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button disabled={createChannelMutation.isPending} type="submit">
              {createChannelMutation.isPending
                ? "Creating..."
                : " Create New Channel"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateNewChannel
