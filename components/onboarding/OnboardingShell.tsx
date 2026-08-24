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
    <main className="h-dvh overflow-hidden bg-background p-4 text-foreground sm:p-5">
      <div className="grid h-full min-h-0 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10 lg:grid-cols-[300px_1fr] xl:grid-cols-[320px_1fr]">
        <aside className="hidden border-b border-workspace-rail-border bg-workspace-rail p-5 text-sidebar-foreground lg:block lg:border-r lg:border-b-0 lg:p-6 xl:p-8">
          <Image
            src="/logos/teamflow-wordmark.svg"
            alt="TeamFlow"
            width={170}
            height={37}
            priority
            className="mb-7 h-auto w-36 xl:mb-10 xl:w-40"
          />

          <div className="mb-6 flex items-center gap-3 xl:mb-8 xl:gap-4">
            <div className="grid size-11 place-items-center rounded-xl bg-workspace-rail-accent text-base font-semibold text-sidebar-foreground shadow-inner shadow-white/10 xl:size-12 xl:text-lg">
              {workspaceName?.slice(0, 2).toUpperCase() ?? "TW"}
            </div>
            <div>
              <p className="text-sm font-medium text-sidebar-foreground/60">
                Workspace
              </p>
              <div className="text-base font-semibold xl:text-lg">
                {workspaceName ?? "New Workspace"}
              </div>
            </div>
          </div>

          <div className="space-y-2.5 border-t border-white/10 pt-5 text-sm font-medium text-sidebar-foreground/70 xl:space-y-3 xl:pt-7">
            <p className="rounded-lg bg-white/10 px-3 py-2 text-sidebar-foreground">
              # general
            </p>
            <p className="px-3 py-2">Channels</p>
            <p className="px-3 py-2">Direct messages</p>
          </div>
        </aside>

        <section className="flex min-h-0 w-full flex-col overflow-hidden px-6 py-5 sm:px-8 lg:px-12 lg:py-6 xl:px-16 xl:py-8">
          <Image
            src="/logos/teamflow-wordmark.svg"
            alt="TeamFlow"
            width={170}
            height={37}
            priority
            className="mb-5 h-auto w-32 lg:hidden"
          />

          <div className="mb-5 max-w-5xl xl:mb-6 xl:max-w-6xl">
            <div className="mb-4 flex items-center gap-4 xl:mb-5">
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
            <h1 className="text-4xl font-semibold leading-none tracking-tight text-foreground sm:text-[clamp(2.5rem,4vw,4.25rem)]">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground lg:text-lg">
              {description}
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </section>
      </div>
    </main>
  )
}
