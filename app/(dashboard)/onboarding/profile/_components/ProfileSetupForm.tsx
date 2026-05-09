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

const ProfileFormSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
})

const ProfileSetupForm = () => {
  const { data } = useSuspenseQuery(orpc.onboarding.state.queryOptions())
  const queryClient = useQueryClient()
  const router = useRouter()

  console.log("Profile SetUp Form, ONBOARDING STATE: ", { data })

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
                <FormLabel className="text-base text-white/80">
                  Your Name
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="h-16 border-white/15 bg-transparent text-2xl text-white placeholder:text-white/35"
                    placeholder="Your Name"
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
            className="bg-[#611f69] px-8 hover:bg-[#4e1755]"
          >
            Next
          </Button>
        </form>
      </Form>
    </OnboardingShell>
  )
}

export default ProfileSetupForm
