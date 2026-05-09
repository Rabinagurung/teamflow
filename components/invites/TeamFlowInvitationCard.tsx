import Image from "next/image"
import { Hash, MessageCircle, Sparkles, Users } from "lucide-react"
import type { ReactNode } from "react"

type TeamFlowInvitationCardProps = {
  organizationName: string
  role: string
  children: ReactNode
}

export function TeamFlowInvitationCard({
  organizationName,
  role,
  children,
}: TeamFlowInvitationCardProps) {
  return (
    <main className="min-h-screen bg-secondary/60 p-4 text-foreground sm:p-5">
      <div className="grid min-h-[calc(100vh-32px)] overflow-hidden rounded-2xl border border-border bg-secondary/60 shadow-2xl shadow-primary/10 sm:min-h-[calc(100vh-40px)] lg:grid-cols-[320px_1fr]">
        <aside className="border-b border-workspace-rail-border bg-workspace-rail p-6 text-sidebar-foreground lg:border-r lg:border-b-0 lg:p-8">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-primary shadow-inner shadow-white/10">
              <Image
                src="/logos/teamflow-mark.svg"
                alt=""
                width={24}
                height={24}
                priority
                className="size-6"
              />
            </div>
            <p className="text-lg font-semibold text-sidebar-foreground">
              TeamFlow
            </p>
          </div>

          <div className="mt-12 space-y-3 border-t border-white/10 pt-7 text-sm font-medium text-sidebar-foreground/70">
            <p className="rounded-lg bg-white/10 px-3 py-2 text-sidebar-foreground">
              Invitation
            </p>
            <p className="px-3 py-2">Channels</p>
            <p className="px-3 py-2">Direct messages</p>
          </div>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/8 p-4">
            <p className="text-sm font-semibold text-sidebar-foreground">
              You&apos;re invited as {role}
            </p>
            <p className="mt-2 text-sm leading-6 text-sidebar-foreground/70">
              Join {organizationName} to chat in channels, follow updates, and
              work with the team in one place.
            </p>
          </div>
        </aside>

        <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-16">
          <div className="w-full max-w-4xl">
            <div className="grid overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10 lg:grid-cols-[1.05fr_.95fr]">
              <div className="p-6 sm:p-8 lg:p-10">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                  Workspace invitation
                </p>
                <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                  Join {organizationName} on TeamFlow
                </h1>
                <p className="mt-5 text-lg leading-8 text-muted-foreground">
                  You&apos;ve been invited to collaborate as a {role}. Accept
                  the invitation to open the workspace and start catching up
                  with the team.
                </p>

                <div className="mt-8 rounded-2xl border border-border bg-secondary/60 p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-12 place-items-center rounded-xl bg-accent text-lg font-semibold text-accent-foreground">
                      {organizationName.trim().charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{organizationName}</p>
                      <p className="text-sm text-muted-foreground">
                        Role: {role}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8">{children}</div>
              </div>

              <div className="border-t border-border bg-background p-6 lg:border-t-0 lg:border-l">
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <Hash className="size-4 text-primary" />
                      <p className="font-semibold">general</p>
                    </div>
                    <Users className="size-4 text-muted-foreground" />
                  </div>

                  <div className="space-y-4 py-5">
                    <PreviewMessage
                      icon={<MessageCircle className="size-4" />}
                      title="Welcome thread"
                      description="Meet the team and see what is moving today."
                    />
                    <PreviewMessage
                      icon={<Sparkles className="size-4" />}
                      title="AI summaries"
                      description="Catch up quickly before jumping in."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function PreviewMessage({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex gap-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-primary">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}
