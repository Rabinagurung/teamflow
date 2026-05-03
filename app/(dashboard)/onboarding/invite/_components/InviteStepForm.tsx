"use client"

import { onboardingInviteSchema } from "@/app/schemas/onboarding"
import OnboardingShell from "@/components/onboarding/OnboardingShell"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { orpc } from "@/lib/orpc/orpc"
import { zodResolver } from "@hookform/resolvers/zod"
import { isDefinedError } from "@orpc/client"
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { schema } from "better-auth/client/plugins"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"
import SkipInviteDialog from "./SkipInviteDialog"

const InviteFormSchema = z.object({
  emails: z.string().trim().min(1, "Add at least one email or skip this step"),
})

const InviteStepForm = () => {
  const { data } = useSuspenseQuery(orpc.onboarding.state.queryOptions())
  const queryClient = useQueryClient()
  const router = useRouter()

  const form = useForm<z.infer<typeof InviteFormSchema>>({
    resolver: zodResolver(InviteFormSchema),
    defaultValues: {
      emails: "",
    },
  })

  const inviteMutation = useMutation(
    orpc.onboarding.invite.submit.mutationOptions({
      onSuccess: async ({ nextStep, invitedCount, failedEmails }) => {
        await queryClient.invalidateQueries({
          queryKey: orpc.onboarding.state.queryKey(),
        })
        if (invitedCount > 0)
          toast.success(
            `${invitedCount} invitation${invitedCount > 1 ? "s" : ""} sent`,
          )
        if (failedEmails.length > 0)
          toast.warning(`Failed: ${failedEmails.slice(0, 3).join(", ")}`)
        router.push(`/onboarding/${nextStep}`)
        router.refresh()
      },
      onError: (error) => {
        toast.error(
          isDefinedError(error) ? error.message : "Unable to send invitations",
        )
      },
    }),
  )

  const skipMutation = useMutation(
    orpc.onboarding.invite.skip.mutationOptions({
      onSuccess: async ({ nextStep }) => {
        await queryClient.invalidateQueries({
          queryKey: orpc.onboarding.state.queryKey(),
        })
        router.push(`/onboarding/${nextStep}`)
        router.refresh()
      },
    }),
  )

  const onSubmit = (values: z.infer<typeof schema>) => {
    // const parsed = onboardingInviteSchema.safeParse({
    //   emails: parseEmails(values.emails),
    // })
    // if (!parsed.success) {
    //   form.setError("emails", {
    //     message: parsed.error.issues[0]?.message ?? "Invalid emails",
    //   })
    //   return
    // }
    // inviteMutation.mutate(parsed.data)
  }

  const isPending = inviteMutation.isPending || skipMutation.isPending

  return (
    <OnboardingShell
      step={1}
      totalSteps={4}
      workspaceName={data.state.workspaceName ?? "New Workspace"}
      title="Who else is in the TeamFlow group?"
      description="Add coworkers by email, or skip this step and invite them later."
    >
      <Form {...form}>
        <form className="space-y-8">
          <FormField
            control={form.control}
            name="emails"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base text-white/80">
                  Add coworker by email
                </FormLabel>
                <FormControl>
                  <textarea
                    {...field}
                    disabled={isPending}
                    className="min-h-45 w-full rounded-2xl border border-cyan-500/60 bg-transparent p-5 text-xl text-white outline-none placeholder:text-white/35 "
                    placeholder="alex@company.com, maria@company.com"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <p className="text-sm text-white/60">
            Keep in mind that invitations expire in 30 days.
          </p>

          <div className="flex items-center gap-4">
            <Button
              type="submit"
              size="lg"
              disabled={isPending}
              className="bg-[#611f69] px-8 hover:bg-[#4e1755]"
            >
              {inviteMutation.isPending ? "Sending..." : "Next"}
            </Button>

            <SkipInviteDialog
              disabled={isPending}
              onConfirm={() => skipMutation.mutate()}
            />
          </div>
        </form>
      </Form>
    </OnboardingShell>
  )
}

export default InviteStepForm
