import React from "react"
import Image from "next/image"

type OnboardingShellProps = {
  step: number
  totalSteps: number
  workspaceName?: string
  title: string
  description: string
  children: React.ReactNode
}

export default function OnboardingShell({
  step,
  totalSteps,
  workspaceName,
  title,
  description,
  children,
}: OnboardingShellProps) {
  const progress = `${Math.round((step / totalSteps) * 100)}%`

  return (
    <main className="min-h-screen bg-background p-4 text-foreground sm:p-5">
      <div className="grid min-h-[calc(100vh-32px)] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10 sm:min-h-[calc(100vh-40px)] lg:grid-cols-[320px_1fr]">
        <aside className="border-b border-workspace-rail-border bg-workspace-rail p-6 text-sidebar-foreground lg:border-r lg:border-b-0 lg:p-8">
          <Image
            src="/logos/teamflow-wordmark.svg"
            alt="TeamFlow"
            width={170}
            height={37}
            priority
            className="mb-10 h-auto w-40"
          />

          <div className="mb-8 flex items-center gap-4">
            <div className="grid size-12 place-items-center rounded-xl bg-workspace-rail-accent text-lg font-semibold text-sidebar-foreground shadow-inner shadow-white/10">
              {workspaceName?.slice(0, 2).toUpperCase() ?? "TW"}
            </div>
            <div>
              <p className="text-sm font-medium text-sidebar-foreground/60">
                Workspace
              </p>
              <div className="text-lg font-semibold">
                {workspaceName ?? "New Workspace"}
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-white/10 pt-7 text-sm font-medium text-sidebar-foreground/70">
            <p className="rounded-lg bg-white/10 px-3 py-2 text-sidebar-foreground">
              # general
            </p>
            <p className="px-3 py-2">Channels</p>
            <p className="px-3 py-2">Direct messages</p>
          </div>
        </aside>

        <section className="flex w-full flex-col px-6 py-10 sm:px-10 lg:px-16 lg:py-16">
          <div className="mb-10 max-w-6xl">
            <div className="mb-5 flex items-center gap-4">
              <p className="text-sm font-semibold text-muted-foreground">
                Step {step} of {totalSteps}
              </p>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: progress }}
                />
              </div>
            </div>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              {description}
            </p>
          </div>

          <div className="w-full">{children}</div>
        </section>
      </div>
    </main>
  )
}
