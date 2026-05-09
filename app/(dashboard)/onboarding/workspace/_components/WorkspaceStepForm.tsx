"use client"

import { workspaceSchema } from "@/app/schemas/workspace"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import OnboardingShell from "@/components/onboarding/OnboardingShell"
import { orpc } from "@/lib/orpc/orpc"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import z from "zod"
import { toast } from "sonner"
import { LoadingSwap } from "@/components/ui/loading-swap"
import { Button } from "@/components/ui/button"

const WorkspaceStepForm = () => {
  const { data: onboardingData } = useQuery(
    orpc.onboarding.state.queryOptions(),
  )

  const { data: workspaceListData } = useQuery(
    orpc.workspace.list.queryOptions(),
  )

  const queryClient = useQueryClient()
  const router = useRouter()

  const mutation = useMutation(
    orpc.onboarding.workspace.create.mutationOptions({
      onSuccess: async ({ nextStep }) => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: orpc.onboarding.state.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: orpc.workspace.list.queryKey(),
          }),
        ])

        router.push(`/onboarding/${nextStep}`)
        router.refresh()
      },
      onError: (error) => {
        toast.error(error.message)
      },
    }),
  )

  const form = useForm<z.infer<typeof workspaceSchema>>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: "",
    },
  })

  function onSubmit(values: z.infer<typeof workspaceSchema>) {
    mutation.mutate(values)
  }

  const workspaceName = form.watch("name")

  console.log("WorkspaceStepForm")
  console.log("onBoardingData, ", onboardingData)
  console.log(" workspaceListData, ", workspaceListData)

  return (
    <OnboardingShell
      step={2}
      totalSteps={4}
      workspaceName={workspaceName || "New Workspace"}
      title="What’s the name of your group?"
      description="This will be the name of your TeamFlow workspace. Choose something your group will recognize."
    >
      <Form {...form}>
        <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base text-foreground">
                  Workspace name
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="h-14 border-input bg-background text-lg text-foreground placeholder:text-muted-foreground"
                    placeholder="TeamFlow Workspace"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" size="lg" className="h-12 px-8">
            <LoadingSwap
              isLoading={mutation.isPending}
              className="inline-flex items-center gap-2"
            >
              Next
            </LoadingSwap>
          </Button>
        </form>
      </Form>
    </OnboardingShell>
  )
}

export default WorkspaceStepForm
