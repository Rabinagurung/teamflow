"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth/auth-client"
import {
  getInviteQueryValue,
  getInviteRedirectPath,
} from "@/lib/invites/invite-redirect"
import { zodResolver } from "@hookform/resolvers/zod"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { EmailVerification } from "./email-verification"
import { ForgotPassword } from "./forgot-password"
import { GuestSignInButton } from "./guest-sign-in-button"
import { SocialAuthButtons } from "./social-auth-buttons"

const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginFormValues = z.infer<typeof loginSchema>

const LoginForm = () => {
  const searchParams = useSearchParams()
  const inviteRedirectPath = useMemo(
    () => getInviteRedirectPath(searchParams.get("inviteURL")),
    [searchParams],
  )
  const callbackURL = inviteRedirectPath ?? "/app-entry"
  const inviteQueryValue = getInviteQueryValue(inviteRedirectPath)
  const signupHref = inviteQueryValue
    ? `/signup?inviteURL=${encodeURIComponent(inviteQueryValue)}`
    : "/signup"

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const [confirmState, setConfirmState] = useState(false)
  const [email, setEmail] = useState("")
  const [openForgotPassword, setOpenForgotPassword] = useState(false)

  function handleOpenForgotPasswordSet(value: boolean) {
    setOpenForgotPassword(value)
  }

  // const signInWithGithub = async () => {
  //   await authClient.signIn.social(
  //     {
  //       provider: "github",
  //       callbackURL: "/app-entry",
  //     },
  //     {
  //       onSuccess: () => {},
  //       onError: () => {
  //         toast.error("Something went wrong")
  //       },
  //     },
  //   )
  // }

  // const signInWithGoogle = async () => {
  //   await authClient.signIn.social(
  //     {
  //       provider: "google",
  //       callbackURL: "/app-entry",
  //     },
  //     {
  //       onSuccess: () => {},
  //       onError: () => {
  //         toast.error("Something went wrong")
  //       },
  //     },
  //   )
  // }

  const onSubmit = async (values: LoginFormValues) => {
    await authClient.signIn.email(
      {
        email: values.email,
        password: values.password,
        callbackURL,
      },
      {
        onError: (error) => {
          if (error.error.code === "EMAIL_NOT_VERIFIED") {
            // console.log("Here error")
            setEmail(values.email)
            setConfirmState(true)
          }

          toast.error(error.error.message || "Failed to sign in")
        },
      },
    )
  }

  const isPending = form.formState.isSubmitting

  if (openForgotPassword) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Forgot your password?</CardTitle>
          <CardDescription>
            Enter your email address and we&apos; ll send you a reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPassword
            onOpenForgotPasswordSet={handleOpenForgotPasswordSet}
          />
        </CardContent>
      </Card>
    )
  }

  if (confirmState && email) {
    return <EmailVerification email={email} />
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Sign in to TeamFlow</CardTitle>
          <CardDescription className="text-[18px]">
            or choose another way to sign in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-6">
                <div className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="johndoe@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center">
                          <FormLabel>Password</FormLabel>
                          <Button
                            onClick={() => setOpenForgotPassword(true)}
                            type="button"
                            variant="link"
                            size="sm"
                            className="underline text-primary hover:text-primary/90"
                          >
                            Forgot password ?
                          </Button>
                        </div>

                        <FormControl>
                          <Input
                            type="password"
                            placeholder="**********"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full text-base"
                    disabled={isPending}
                  >
                    Login
                  </Button>
                  <div className="text-center text-sm">
                    Don&apos;t have an account ?{" "}
                    <Link
                      href={signupHref}
                      className="underline underline-offset-4 text-primary hover:text-primary/90"
                    >
                      Sign up
                    </Link>
                  </div>
                </div>
              </div>
            </form>
          </Form>

          <div className="grid grid-cols-2 mt-6 gap-3">
            <SocialAuthButtons callbackURL={callbackURL} />
          </div>

          <div className="mt-6 border-t pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Recruiter reviewing a workspace? No account needed.
            </p>
            <GuestSignInButton callbackURL={callbackURL} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginForm
