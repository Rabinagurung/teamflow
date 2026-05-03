import React from "react"

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
  return (
    <main className="min-h-screen bg-[#32093d] p-5 text-white">
      <div className="grid min-h-[calc(100vh-40px)] grid-cols-[320px_1fr] overflow-hidden rounded-2xl border border-white/10 bg-[#1e1f24]">
        <aside className="border-r border-white/10 p-8  bg-[#2a0d31]">
          <div className="mb-8 flex items-center gap-4">
            <div className="grid size-14 place-items-center rounded-xl bg-white/15 text-2xl font-semibold">
              {workspaceName?.slice(0, 2).toUpperCase() ?? "TW"}
            </div>
            <div className="text-xl font-semibold">
              {workspaceName ?? "New Workspace"}
            </div>
          </div>

          <div className="space-y-6 pt-8 text-white/70">
            <p className="font-medium">Channels</p>
            <p className="font-medium">Direct messages</p>
          </div>
        </aside>
        <section className="mx-auto flex w-full max-w-5xl flex-col px-16 py-20">
          <p className="mb-8 text-xl text-white/50">
            Step {step} of {totalSteps}
          </p>
          <h1 className="max-w-3xl text-6xl font-semibold leading-[0.95] tracking-tight">
            {title}
          </h1>
          <p className="mt-8 max-w-3xl text-2xl leading-10 text-white/75">
            {description}
          </p>
          <div className="mt-12">{children}</div>
        </section>
      </div>
    </main>
  )
}
