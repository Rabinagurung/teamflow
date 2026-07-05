import { requireAuth } from "@/lib/auth/auth-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getWorkspaceColor } from "@/lib/utlis/get-workspace-color"
import { cn } from "@/lib/utlis/utils"
import {
  BotMessageSquare,
  ChevronRight,
  CreditCard,
  FileText,
  History,
  Mail,
  PenLine,
  Settings,
  Sparkles,
  Users,
} from "lucide-react"
import Link from "next/link"
import type { ComponentType } from "react"
import AdminPageShell from "./_components/AdminPageShell"

type AdminWorkspacePageProps = {
  params: Promise<{ workspaceId: string }>
}

type AdminHomeLinkCardProps = {
  href: string
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
  iconClassName: string
}

const AdminHomeLinkCard = ({
  href,
  title,
  description,
  icon: Icon,
  iconClassName,
}: AdminHomeLinkCardProps) => {
  return (
    <Link href={href} className="block">
      <Card className="overflow-hidden rounded-[28px] border-border/80 py-0 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.35)] transition-all hover:-translate-y-0.5 hover:bg-muted/20">
        <CardContent className="flex items-start gap-4 p-5 md:p-6">
          <div
            className={`flex size-14 shrink-0 items-center justify-center rounded-2xl shadow-sm ${iconClassName}`}
          >
            <Icon className="size-6 text-white" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            <p className="mt-1 text-sm leading-7 text-muted-foreground">
              {description}
            </p>
          </div>

          <ChevronRight className="mt-2 size-5 shrink-0 text-muted-foreground/45" />
        </CardContent>
      </Card>
    </Link>
  )
}

type AdminHomeRowLinkProps = {
  href: string
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
  iconClassName: string
}

const AdminHomeRowLink = ({
  href,
  title,
  description,
  icon: Icon,
  iconClassName,
}: AdminHomeRowLinkProps) => {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-2xl px-3 py-3 transition-colors hover:bg-muted/30"
    >
      <div
        className={`mt-0.5 flex size-12 shrink-0 items-center justify-center rounded-xl shadow-sm ${iconClassName}`}
      >
        <Icon className="size-6 text-white" />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-[1.35rem] font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-7 text-muted-foreground">
          {description}
        </p>
      </div>

      <ChevronRight className="mt-2 size-5 shrink-0 text-muted-foreground/45 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

const AdminWorkspacePage = async ({ params }: AdminWorkspacePageProps) => {
  const session = await requireAuth()
  const { workspaceId } = await params
  const billingHref = `/admin/${workspaceId}/billing`

  return (
    <AdminPageShell
      title={
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex size-11 items-center justify-center rounded-xl text-lg font-semibold shadow-sm",
              getWorkspaceColor(workspaceId),
            )}
          >
            {session.user.name.charAt(0).toUpperCase()}
          </div>
          <span>Hello {session.user.name}!</span>
        </div>
      }
      description="Manage profile details, membership, invitations, and billing from one clean admin space."
      framed={false}
    >
      <div className="space-y-6">
        <AdminHomeLinkCard
          href={`/admin/${workspaceId}/settings`}
          title="Account Settings"
          description="Edit your profile, update your username and password, and manage other account settings."
          icon={Settings}
          iconClassName="bg-sky-500"
        />

        <Card className="overflow-hidden rounded-[28px] border-border/80 shadow-[0_20px_50px_-36px_rgba(15,23,42,0.35)]">
          <CardContent className="space-y-2 p-4 md:p-5">
            <AdminHomeRowLink
              href={`/admin/${workspaceId}/members`}
              title="Manage Your Members"
              description="Invite new members and manage user permissions."
              icon={Users}
              iconClassName="bg-orange-500"
            />

            <AdminHomeRowLink
              href={`/admin/${workspaceId}/invitations`}
              title="Manage Your Invitations"
              description="Review pending invites and resend them when needed."
              icon={Mail}
              iconClassName="bg-violet-500"
            />

            <div className="rounded-2xl bg-muted/20 px-3 py-4">
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5 flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 shadow-sm">
                  <CreditCard className="size-6 text-white" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-[1.35rem] font-semibold tracking-tight text-foreground">
                        Billing
                      </h3>
                      <p className="mt-1 text-sm leading-7 text-muted-foreground">
                        Your workspace is on the{" "}
                        <span className="font-semibold text-foreground">
                          Free plan
                        </span>
                        .
                      </p>
                    </div>

                    <Link
                      href={billingHref}
                      className="mt-2 shrink-0 text-muted-foreground/45 transition-colors hover:text-foreground"
                    >
                      <ChevronRight className="size-5" />
                    </Link>
                  </div>

                  <div className="mt-4 space-y-4">
                    <p className="text-sm leading-6 text-muted-foreground">
                      Upgrade to unlock additional features, including:
                    </p>

                    <ul className="space-y-1 text-sm leading-6 text-foreground">
                      <li className="flex items-center gap-2">
                        <History className="size-4 shrink-0" />
                        <span>Unlimited message history</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <BotMessageSquare className="size-4 shrink-0" />
                        <span>Echo AI Q&amp;A assistant</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <FileText className="size-4 shrink-0" />
                        <span>AI-powered thread summaries</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <PenLine className="size-4 shrink-0" />
                        <span>AI-powered message polishing</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Sparkles className="size-4 shrink-0" />
                        <span>AI-powered thread polishing</span>
                      </li>
                    </ul>

                    <div className="flex flex-wrap gap-3 pt-1">
                      <Button asChild className="rounded-xl shadow-sm">
                        <Link href={billingHref}>Upgrade Your Team</Link>
                      </Button>

                      <Button asChild variant="outline" className="rounded-xl">
                        <Link href={billingHref}>Compare Plans</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPageShell>
  )
}

export default AdminWorkspacePage
