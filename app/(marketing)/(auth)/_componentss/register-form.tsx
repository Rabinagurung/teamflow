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
import { SocialAuthButtons } from "./social-auth-buttons"

export const registerSchema = z
  .object({
    name: z.string().min(1, "Please enter your name"),
    email: z.email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

const RegisterForm = () => {
  // const router = useRouter()
  const searchParams = useSearchParams()
  const inviteRedirectPath = useMemo(
    () => getInviteRedirectPath(searchParams.get("inviteURL")),
    [searchParams],
  )
  const callbackURL = inviteRedirectPath ?? "/verify"
  const inviteQueryValue = getInviteQueryValue(inviteRedirectPath)
  const loginHref = inviteQueryValue
    ? `/login?inviteURL=${encodeURIComponent(inviteQueryValue)}`
    : "/login"

  const [confirmState, setConfirmState] = useState(false)
  const [email, setEmail] = useState("")

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  // const signInWithGithub = async () => {
  //   await authClient.signIn.social(
  //     {
  //       provider: "github",
  //       callbackURL: "/app-entry",
  //     },
  //     {
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
  //       callbackURL: "/workspace",
  //     },
  //     {
  //       onSuccess: () => {
  //         router.push("/app-entry")
  //       },
  //       onError: () => {
  //         toast.error("Something went wrong")
  //       },
  //     },
  //   )
  // }

  const onSubmit = async (values: RegisterFormValues) => {
    await authClient.signUp.email(
      {
        name: values.name,
        email: values.email,
        password: values.password,
        callbackURL,
      },
      {
        //fetchOptions
        onSuccess: () => {
          setEmail(values.email)
          setConfirmState(true)
        },
        onError: (ctx) => {
          toast.error(ctx.error.message)
        },
      },
    )
  }

  const isPending = form.formState.isSubmitting

  return (
    <div className="flex flex-col gap-6">
      {confirmState && email ? (
        <EmailVerification email={email} />
      ) : (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Get Started</CardTitle>
            <CardDescription className="text-[18px]">
              Create your account to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-6">
                  {/* <div className="flex flex-col gap-4">
                    <Button
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
                    </Button>
                  </div> */}
                  <div className="grid gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                          <FormLabel>Password</FormLabel>
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
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ConfirmPassword</FormLabel>
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
                      className="text-base w-full"
                      disabled={isPending}
                    >
                      Sign up
                    </Button>
                    <div className="text-center text-sm">
                      Already have an account ?{" "}
                      <Link
                        href={loginHref}
                        className="underline underline-offset-4 text-primary hover:text-primary/90"
                      >
                        Login
                      </Link>
                    </div>
                  </div>
                </div>
              </form>
            </Form>

            <div className="grid grid-cols-2 mt-6 gap-3">
              <SocialAuthButtons
                callbackURL={inviteRedirectPath ?? "/app-entry"}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default RegisterForm
