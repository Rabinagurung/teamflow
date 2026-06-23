"use client"

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
import { LoadingSwap } from "@/components/ui/loading-swap"
import { authClient } from "@/lib/auth/auth-client"
import { zodResolver } from "@hookform/resolvers/zod"
import { usePathname, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

interface ProfileUpdateFormProps {
  user: {
    name: string
    email: string
  }
}

const profileUpdateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z
    .string()
    .email("Enter a valid email address")
    .min(1, "Email is required"),
})

type ProfileUpdateSchemaType = z.infer<typeof profileUpdateSchema>

export function ProfileUpdateForm({ user }: ProfileUpdateFormProps) {
  const router = useRouter()
  const pathname = usePathname()

  const form = useForm<ProfileUpdateSchemaType>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
    },
  })

  const { isSubmitting } = form.formState

  async function handleProfileUpdate(data: ProfileUpdateSchemaType) {
    const promises = [
      authClient.updateUser({
        name: data.name,
      }),
    ]

    if (data.email !== user.email) {
      promises.push(
        authClient.changeEmail({
          newEmail: data.email,
          callbackURL: pathname,
        }),
      )
    }

    const res = await Promise.all(promises)

    const updateUserResult = res[0]
    const emailResult = res[1] ?? { error: null }

    if (updateUserResult.error) {
      toast.error(updateUserResult.error.message || "Failed to update profile")
      return
    }

    if (emailResult.error) {
      toast.error(emailResult.error.message || "Failed to change email")
      return
    }

    if (data.email !== user.email) {
      toast.success("Verify your new email address to complete the change.")
    } else {
      toast.success("Profile updated successfully")
    }

    router.refresh()
  }

  return (
    <Form {...form}>
      <form
        className="space-y-5"
        onSubmit={form.handleSubmit(handleProfileUpdate)}
      >
        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-foreground">
            Update your details
          </h3>
          <p className="text-sm leading-6 text-muted-foreground">
            Keep your name and primary email up to date everywhere you use
            TeamFlow.
          </p>
        </div>

        <div className="grid gap-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
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
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    {...field}
                    className="h-11 rounded-xl border-border/70 bg-background"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl shadow-sm"
        >
          <LoadingSwap isLoading={isSubmitting}>Update Profile</LoadingSwap>
        </Button>
      </form>
    </Form>
  )
}
