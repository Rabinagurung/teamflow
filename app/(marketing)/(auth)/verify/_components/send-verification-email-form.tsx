"use client"

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
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"

import { Button } from "@/components/ui/button"

const verificationEmailSchema = z.object({
  email: z.email("Please enter a valid email address"),
})

type VerificationEmailForm = z.infer<typeof verificationEmailSchema>

const SendVerificationEmailForm = () => {
  const router = useRouter()

  const form = useForm<VerificationEmailForm>({
    resolver: zodResolver(verificationEmailSchema),
    defaultValues: {
      email: "",
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(data: VerificationEmailForm) {
    if (!data.email) return toast("Please enter your email")

    await authClient.sendVerificationEmail({
      email: data.email,
      callbackURL: "/auth/verify",

      fetchOptions: {
        onError: (ctx) => {
          toast.error(ctx.error.message)
        },

        onSuccess: () => {
          console.log("OnSuccess: ")
          toast.success("Verification email sent successfully.")

          router.push("/auth/verify/success")
        },
      },
    })
  }

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} required />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          <LoadingSwap isLoading={isSubmitting}>
            Resend Verification Email
          </LoadingSwap>
        </Button>
      </form>
    </Form>
  )
}

export default SendVerificationEmailForm
