"use client"

import { Button } from "@/components/ui/button"

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const handleTryAgain = () => {
    reset()
    window.location.reload()
  }

  const handleGoHome = () => {
    window.location.assign("/app-entry")
  }

  return (
    <main className="min-h-screen bg-background p-4 text-foreground sm:p-5">
      <div className="grid min-h-[calc(100vh-32px)] place-items-center overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10 sm:min-h-[calc(100vh-40px)]">
        <div className="w-full max-w-md rounded-2xl border border-border bg-background/80 p-6 text-center shadow-xl shadow-primary/5 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Page not found
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Something went wrong while loading this page. Please try again.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Button variant="outline" onClick={handleTryAgain}>
              Try again
            </Button>

            <Button onClick={handleGoHome}>Go home</Button>
          </div>
        </div>
      </div>
    </main>
  )
}
