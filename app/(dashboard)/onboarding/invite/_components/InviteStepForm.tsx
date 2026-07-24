"use client"

import { onboardingInviteSchema } from "@/app/schemas/onboarding"

import { WorkspaceInviteMembersForm } from "@/components/invitations/WorkspaceInviteMembersForm"
import OnboardingShell from "@/components/onboarding/OnboardingShell"
import { orpc } from "@/lib/orpc/orpc"
import { isDefinedError } from "@orpc/client"
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import SkipInviteDialog from "./SkipInviteDialog"

const InviteStepForm = () => {
  const { data } = useSuspenseQuery(orpc.onboarding.state.queryOptions())
  const queryClient = useQueryClient()
  const router = useRouter()

  const inviteMutation = useMutation(
    orpc.onboarding.invite.submit.mutationOptions({
      onSuccess: async ({
        invitedCount,
        failedEmails,
        existingMemberEmails,
        alreadyInvitedEmails,
        selfEmails,
        nextStep,
      }) => {
        await queryClient.invalidateQueries({
          queryKey: orpc.onboarding.state.queryKey(),
        })

        if (invitedCount > 0) {
          toast.success(
            `${invitedCount} invitation${invitedCount > 1 ? "s" : ""} sent`,
          )
        }

        if (existingMemberEmails.length > 0) {
          toast.warning(
            `Already members: ${existingMemberEmails.slice(0, 3).join(", ")}`,
          )
        }

        if (alreadyInvitedEmails.length > 0) {
          toast.warning(
            `Already invited: ${alreadyInvitedEmails.slice(0, 3).join(", ")}`,
          )
        }

        if (selfEmails.length > 0) {
          toast.warning("You cannot invite yourself")
        }

        if (failedEmails.length > 0) {
          toast.error(`Failed: ${failedEmails.slice(0, 3).join(", ")}`)
        }

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
      onError: (error) => {
        toast.error(
          isDefinedError(error) ? error.message : "Unable to skip this step",
        )
      },
    }),
  )

  const isPending = inviteMutation.isPending || skipMutation.isPending

  return (
    <OnboardingShell
      step={3}
      totalSteps={4}
      workspaceName={data.state.workspaceName ?? "New Workspace"}
      title="Who else is in the TeamFlow group?"
      description="Work moves faster with others in Teamflow. Start by adding the people you work with the most."
    >
      <WorkspaceInviteMembersForm
        onSubmit={(values) => {
          const parsed = onboardingInviteSchema.safeParse(values)

          if (!parsed.success) {
            toast.error(parsed.error.issues[0]?.message ?? "Invalid emails")
            return
          }

          inviteMutation.mutate(parsed.data)
        }}
        isPending={isPending}
        formClassName="max-w-3xl space-y-8"
        secondaryAction={
          <SkipInviteDialog
            disabled={isPending}
            onConfirm={() => skipMutation.mutate()}
          />
        }
      />
    </OnboardingShell>
  )
}

export default InviteStepForm
