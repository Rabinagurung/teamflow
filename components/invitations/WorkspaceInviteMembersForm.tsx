import { zodResolver } from "@hookform/resolvers/zod"
import { ReactNode } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "../ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form"
import { LoadingSwap } from "../ui/loading-swap"
import InviteEmailsInput from "./InviteEmailsInput"
import { inviteEmailSchema } from "@/app/schemas/onboarding"

const workspaceInviteMembersFormSchema = z.object({
  emails: z.array(inviteEmailSchema).min(1, "Add at least one email"),
})

export type WorkspaceInviteMembersFormValues = z.infer<
  typeof workspaceInviteMembersFormSchema
>

interface WorkspaceInviteMembersFormProps {
  onSubmit: (values: WorkspaceInviteMembersFormValues) => void
  isPending?: boolean
  secondaryAction?: ReactNode
  formClassName?: string
}

export function WorkspaceInviteMembersForm({
  onSubmit,
  isPending = false,
  secondaryAction,
  formClassName = "space-y-4",
}: WorkspaceInviteMembersFormProps) {
  const form = useForm<WorkspaceInviteMembersFormValues>({
    resolver: zodResolver(workspaceInviteMembersFormSchema),
    defaultValues: { emails: [] },
    mode: "onChange",
  })

  return (
    <Form {...form}>
      <form className={formClassName} onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="emails"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base text-foreground">
                Add coworkers by emails as members
              </FormLabel>

              <FormControl>
                <InviteEmailsInput
                  value={field.value}
                  onChange={(nextEmails) => {
                    field.onChange(nextEmails)
                    form.clearErrors("emails")
                  }}
                  disabled={isPending}
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <p className="text-sm text-muted-foreground">
          Invitations expire in 30 days. Add one or more teammates by email.
        </p>
        <div className="flex items-center gap-4">
          <Button
            type="submit"
            size="lg"
            className="h-12 px-8"
            disabled={isPending}
          >
            <LoadingSwap
              isLoading={isPending}
              className="inline-flex items-center gap-2"
            >
              Invite
            </LoadingSwap>
          </Button>
          {secondaryAction}
        </div>
      </form>
    </Form>
  )
}
