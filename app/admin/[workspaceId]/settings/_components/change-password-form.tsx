"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingSwap } from "@/components/ui/loading-swap"
import { authClient } from "@/lib/auth/auth-client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
  revokeOtherSessions: z.boolean(),
})

type ChangePasswordSchemaType = z.infer<typeof changePasswordSchema>

export function ChangePasswordForm() {
  // const router = useRouter()

  const form = useForm<ChangePasswordSchemaType>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      revokeOtherSessions: true,
    },
  })

  const { isSubmitting } = form.formState

  async function handlePasswordChange(data: ChangePasswordSchemaType) {
    await authClient.changePassword(data, {
      onError: (error) => {
        toast.error(error.error.message || "Failed to change password")
      },
      onSuccess: () => {
        toast.success("Password changed successfully")
        form.reset()
      },
    })
  }

  return (
    <Form {...form}>
      <form
        className="space-y-5"
        onSubmit={form.handleSubmit(handlePasswordChange)}
      >
        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-foreground">
            Choose a new password
          </h3>
          <p className="text-sm leading-6 text-muted-foreground">
            Use a strong password you haven&apos;t used elsewhere and decide
            whether other sessions should stay signed in.
          </p>
        </div>

        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Current Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  {...field}
                  className="h-11 rounded-xl border-border/70 bg-background"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  {...field}
                  className="h-11 rounded-xl border-border/70 bg-background"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="revokeOtherSessions"
          render={({ field }) => (
            <FormItem className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/10 p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1">
                <FormLabel className="text-sm font-medium text-foreground">
                  Log out other sessions
                </FormLabel>
                <p className="text-sm leading-6 text-muted-foreground">
                  End sign-in sessions on your other devices after the password
                  changes.
                </p>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl shadow-sm"
        >
          <LoadingSwap isLoading={isSubmitting}>Change Password</LoadingSwap>
        </Button>
      </form>
    </Form>
  )
}
