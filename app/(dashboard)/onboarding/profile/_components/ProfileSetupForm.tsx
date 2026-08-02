"use client"

import { onboardingProfileSchema } from "@/app/schemas/onboarding"
import { Button } from "@/components/ui/button"
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
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import z from "zod"
import { LoadingSwap } from "@/components/ui/loading-swap"
import { toast } from "sonner"
import { getOnboardingErrorMessage } from "../../_components/get-onboarding-error-message"

const ProfileFormSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
})

const ProfileSetupForm = () => {
  const { data } = useSuspenseQuery(orpc.onboarding.state.queryOptions())
  const queryClient = useQueryClient()
  const router = useRouter()

  // console.log("Profile SetUp Form, ONBOARDING STATE: ", { data })

  const form = useForm<z.infer<typeof ProfileFormSchema>>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      name: data.user.name ?? "",
    },
  })

  const mutation = useMutation(
    orpc.onboarding.profile.save.mutationOptions({
      onSuccess: async ({ nextStep }) => {
        await queryClient.invalidateQueries({
          queryKey: orpc.onboarding.state.queryKey(),
        })

        router.push(`/onboarding/${nextStep}`)
        router.refresh()
      },

      onError: (error) => {
        toast.error(
          getOnboardingErrorMessage(
            error,
            "We couldn't save your profile right now. Please try again.",
          ),
        )
      },
    }),
  )

  function onSubmit(values: z.infer<typeof onboardingProfileSchema>) {
    mutation.mutate(values)
  }

  return (
    <OnboardingShell
      step={1}
      totalSteps={4}
      title="What's your name ? "
      description="Adding your name and profile photo helps your teammates recognize and connect with you more easily."
    >
      <Form {...form}>
        <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base text-foreground">
                  Your Name
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="h-14 border-input bg-background text-lg text-foreground placeholder:text-muted-foreground"
                    placeholder="Your Name"
                    disabled={mutation.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            size="lg"
            disabled={mutation.isPending}
            className="h-12 px-8"
          >
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

export default ProfileSetupForm
