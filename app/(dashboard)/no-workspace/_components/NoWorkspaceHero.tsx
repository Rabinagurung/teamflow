import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function NoWorkspaceHero() {
  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <div className="mx-auto flex max-h-screen max-w-5xl items-center justify-center px-6">
        <div className="grid w-full items-center gap-14 md:grid-cols-[1.1fr_9fr]">
          <section className="space-y-6">
            <p className="text-sm font-semibold tracking-[0.18rem] text-zinc-500">
              TEAMFLOW
            </p>

            <h1 className="text-5xl font-semibold tracking-tight">
              You are new to TeamFlow
            </h1>

            <p className="max-w-xl text-xl leading-9 text-zinc-600">
              We couldn&apos;t find any workspaces for this account yet. Create
              one to get your team started, or sign in with a different email.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="h-14 px-8 text-lg">
                <Link href="/onboarding/profile">Create a Workspace</Link>
              </Button>
            </div>
          </section>

          <div className="flex items-center justify-center">
            <div className="">
              <div />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
