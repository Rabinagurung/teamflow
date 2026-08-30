import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

export default function NoWorkspaceHero() {
  return (
    <main className="min-h-screen bg-background p-4 text-foreground sm:p-5">
      <div className="grid min-h-[calc(100vh-32px)] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10 sm:min-h-[calc(100vh-40px)] lg:grid-cols-[300px_1fr]">
        <aside className="hidden md:block bg-workspace-rail p-6 text-sidebar-foreground lg:p-8">
          <Image
            src="/logos/teamflow-wordmark.svg"
            alt="TeamFlow"
            width={170}
            height={37}
            priority
            className="h-auto w-40"
          />

          <div className="mt-12 space-y-3 border-t border-white/10 pt-7 text-sm font-medium text-sidebar-foreground/70">
            <p className="rounded-lg bg-white/10 px-3 py-2 text-sidebar-foreground">
              # general
            </p>
            <p className="px-3 py-2">Channels</p>
            <p className="px-3 py-2">Direct messages</p>
          </div>
        </aside>

        <section className="flex items-center px-6 py-14 sm:px-10 lg:px-16">
          <div className="max-w-2xl space-y-6">
            <div className="grid size-14 place-items-center rounded-2xl bg-accent text-primary shadow-sm">
              <Image
                src="/logos/teamflow-mark.svg"
                alt=""
                width={36}
                height={36}
                className="size-9"
              />
            </div>

            <p className="text-sm font-semibold uppercase tracking-[0.18rem] text-primary">
              TeamFlow setup
            </p>

            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Create your first workspace
            </h1>

            <p className="max-w-xl text-lg leading-8 text-muted-foreground">
              We couldn&apos;t find any workspaces for this account yet. Create
              one to get your team started, or sign in with a different email.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link href="/onboarding/profile">Create a Workspace</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
