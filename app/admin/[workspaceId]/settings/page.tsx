import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { auth } from "@/lib/auth/auth"
import { getAvatar } from "@/lib/utlis/get-avatar"
import { Key, LinkIcon, Loader2Icon, Shield, User } from "lucide-react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { type ReactNode, Suspense } from "react"
import AdminPageShell from "../_components/AdminPageShell"
import { AccountLinking } from "./_components/account-linking"
import { ChangePasswordForm } from "./_components/change-password-form"
import { ProfileUpdateForm } from "./_components/profile-update-form"
import SessionManagement from "./_components/session-management"
import { SetPasswordButton } from "./_components/set-password-form"
import { SettingsPageFocusRefresh } from "./_components/SettingsPageFocusRefresh"

const settingsCardClassName =
  "overflow-hidden rounded-[26px] border border-border/80 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.35)]"

export default async function AdminSettingsPage() {
  const headerList = await headers()
  const session = await auth.api.getSession({ headers: headerList })

  if (session == null) redirect("/login")

  return (
    <AdminPageShell
      title="Account settings"
      description="Manage your profile, sign-in methods, active sessions, and password security."
      framed={false}
    >
      <SettingsPageFocusRefresh />

      <div className="mx-auto max-w-4xl space-y-5">
        <Card className={settingsCardClassName}>
          <CardContent className="p-6 md:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Avatar className="size-18 rounded-[26px] border border-border/70 shadow-sm">
                <AvatarImage
                  src={getAvatar(
                    session.user.image ?? null,
                    session.user.email,
                  )}
                  alt="User Avatar"
                  className="object-cover"
                />
                <AvatarFallback className="rounded-[26px] text-2xl font-semibold">
                  {session.user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">
                  Signed in as
                </p>
                <div className="space-y-1">
                  <h2 className="truncate text-3xl font-semibold tracking-tight text-foreground">
                    {session.user.name || "User Profile"}
                  </h2>
                  <p className="truncate text-sm text-muted-foreground">
                    {session.user.email}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Tabs className="space-y-5" defaultValue="profile">
          <div className="flex h-12 items-center rounded-[22px] border border-border/70 bg-background px-1 shadow-sm">
            <TabsList className="grid h-10 w-full grid-cols-4 gap-1 bg-transparent p-0">
              {[
                { value: "profile", label: "Profile", icon: User },
                { value: "security", label: "Security", icon: Shield },
                { value: "sessions", label: "Sessions", icon: Key },
                { value: "accounts", label: "Accounts", icon: LinkIcon },
              ].map((item) => (
                <TabsTrigger
                  key={item.value}
                  value={item.value}
                  className="flex h-10 w-full min-w-0 items-center justify-center gap-2 rounded-[16px] border border-transparent bg-transparent px-3 py-0 text-sm font-medium leading-none text-muted-foreground !shadow-none !ring-0 transition-colors hover:bg-muted/40 hover:text-foreground focus-visible:!ring-0 focus-visible:!ring-offset-0 data-[state=active]:border-border/70 data-[state=active]:!bg-muted/50 data-[state=active]:text-foreground data-[state=active]:!shadow-none"
                >
                  <item.icon className="size-4 shrink-0" />
                  <span className="truncate leading-none max-sm:hidden">
                    {item.label}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="profile" className="mt-0">
            <Card className={settingsCardClassName}>
              <CardContent className="">
                <ProfileUpdateForm user={session.user} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-0">
            <LoadingSuspense>
              <SecurityTab email={session.user.email} />
            </LoadingSuspense>
          </TabsContent>

          <TabsContent value="sessions" className="mt-0">
            <LoadingSuspense>
              <SessionsTab currentSessionToken={session.session.token} />
            </LoadingSuspense>
          </TabsContent>

          <TabsContent value="accounts" className="mt-0">
            <LoadingSuspense>
              <LinkedAccountsTab />
            </LoadingSuspense>
          </TabsContent>
        </Tabs>
      </div>
    </AdminPageShell>
  )
}

async function LinkedAccountsTab() {
  const accounts = await auth.api.listUserAccounts({
    headers: await headers(),
  })

  const nonCredentialAccounts = accounts.filter(
    (account) => account.providerId !== "credential",
  )

  return (
    <Card className={settingsCardClassName}>
      <CardContent>
        <AccountLinking currentAccounts={nonCredentialAccounts} />
      </CardContent>
    </Card>
  )
}

async function SessionsTab({
  currentSessionToken,
}: {
  currentSessionToken: string
}) {
  const sessions = await auth.api.listSessions({ headers: await headers() })

  return (
    <Card className={settingsCardClassName}>
      <CardHeader className="border-b border-border/70 bg-muted/10">
        <CardTitle className="text-xl">Active Sessions</CardTitle>
        <CardDescription className="text-sm leading-6">
          Review every browser and device currently signed in to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6">
        <SessionManagement
          sessions={sessions}
          currentSessionToken={currentSessionToken}
        />
      </CardContent>
    </Card>
  )
}

async function SecurityTab({ email }: { email: string }) {
  const [accounts] = await Promise.all([
    auth.api.listUserAccounts({ headers: await headers() }),
  ])

  const hasPasswordAccount = accounts.some(
    (account) => account.providerId === "credential",
  )

  return (
    <div className="space-y-6">
      {hasPasswordAccount ? (
        <Card className={settingsCardClassName}>
          <CardHeader className="border-b border-border/70 bg-muted/10 pb-5">
            <CardTitle className="text-xl">Change Password</CardTitle>
            <CardDescription className="text-sm leading-6">
              Update your password whenever you want a fresh layer of account
              protection.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      ) : (
        <Card className={settingsCardClassName}>
          <CardHeader className="space-y-2 border-b border-border/70 bg-muted/10 pb-5">
            <CardTitle className="text-xl">Set Password</CardTitle>
            <CardDescription className="text-sm leading-6">
              Send yourself a reset email to add a password alongside your
              social sign-in.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            <SetPasswordButton email={email} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function LoadingSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center rounded-[26px] border border-border/80 bg-card p-10 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.35)]">
          <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}
