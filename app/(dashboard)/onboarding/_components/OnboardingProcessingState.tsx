"use client"

import { LoaderCircle } from "lucide-react"

type OnboardingProcessingStateProps = {
  title: string
  description: string
}

export default function OnboardingProcessingState({
  title,
  description,
}: OnboardingProcessingStateProps) {
  return (
    <main className="min-h-screen bg-background p-4 text-foreground sm:p-5">
      <div className="min-h-[calc(100vh-32px)] overflow-hidden rounded-2xl border border-border bg-secondary/60 shadow-2xl shadow-primary/10 sm:min-h-[calc(100vh-40px)]">
        <section className="flex min-h-[calc(100vh-32px)] items-center justify-center px-4 py-10 sm:min-h-[calc(100vh-40px)] sm:px-10 lg:px-16">
          <div className="mx-auto flex max-w-md flex-col items-center text-center">
            <div className="mb-5 grid size-16 place-items-center justify-center rounded-2xl ">
              <LoaderCircle
                className="size-12 animate-spin text-primary"
                strokeWidth={1.75}
              />
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>

            <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
              {description}
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
