import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background p-4 text-foreground sm:p-5">
      <div className="grid min-h-[calc(100vh-32px)] place-items-center overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10 sm:min-h-[calc(100vh-40px)]">
        <div className="w-full max-w-md rounded-2xl border border-border bg-background/80 p-6 text-center shadow-xl shadow-primary/5 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Page not found
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            The page you are looking for does not exist or is no longer
            available.
          </p>

          <div className="mt-6 flex items-center justify-center">
            <Button asChild>
              <Link href="/app-entry">Go home</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
