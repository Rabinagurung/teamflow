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
import { zodResolver } from "@hookform/resolvers/zod"

import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { EmailVerification } from "./email-verification"
import { ForgotPassword } from "./forgot-password"

import { useRouter } from "next/navigation"

const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginFormValues = z.infer<typeof loginSchema>

const LoginForm = () => {
  const router = useRouter()
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
        callbackURL: "/app-entry",
      },
      {
        onError: (error) => {
          if (error.error.code === "EMAIL_NOT_VERIFIED") {
            console.log("Here error")
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
      <ForgotPassword onOpenForgotPasswordSet={handleOpenForgotPasswordSet} />
    )
  }

  if (confirmState && email) {
    return <EmailVerification email={email} />
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Login to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-6">
                <div className="flex flex-col gap-4">
                  {/* <Button
                    variant="outline"
                    className="w-full"
                    type="button"
                    disabled={isPending}
                    onClick={signInWithGoogle}
                  >
                    <Image
                      src="/logos/google.svg"
                      width={20}
                      height={20}
                      alt="Google logo"
                    />
                    Continue with Google
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    type="button"
                    disabled={isPending}
                    onClick={signInWithGithub}
                  >
                    <Image
                      src="/logos/github.svg"
                      width={20}
                      height={20}
                      alt="Github logo"
                    />
                    Continue with Github
                  </Button> */}
                </div>
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
                        {/* <FormLabel>Password</FormLabel> */}
                        <div className="flex justify-between items-center">
                          <FormLabel>Password</FormLabel>
                          <Button
                            onClick={() => setOpenForgotPassword(true)}
                            type="button"
                            variant="link"
                            size="sm"
                            className="text-sm font-normal underline"
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
                  <Button type="submit" className="w-full" disabled={isPending}>
                    Login
                  </Button>
                  <div className="text-center text-sm">
                    Don&apos;t have an account ?{" "}
                    <Link
                      href="/signup"
                      className="underline underline-offset-4"
                    >
                      Sign up
                    </Link>
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginForm
