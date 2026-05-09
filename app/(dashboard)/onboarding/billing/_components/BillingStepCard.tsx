"use client"

import OnboardingShell from "@/components/onboarding/OnboardingShell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { authClient } from "@/lib/auth/auth-client"
import { orpc } from "@/lib/orpc/orpc"
import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  History,
  Sparkles,
  Users,
  Video,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"

const FEATURES = [
  {
    id: "history",
    title: "Unlimited message history",
    description:
      "Search and view all of your team's public messages and files.",
    icon: History,
  },
  {
    id: "meetings",
    title: "Group meetings with AI notes",
    description: "Use huddles in channels and keep automatic notes.",
    icon: Video,
  },
  {
    id: "cross-org",
    title: "Work with people at other organizations",
    description: "Collaborate with external partners in shared spaces.",
    icon: Users,
  },
  {
    id: "ai",
    title: "AI conversation summaries",
    description: "Get up to speed in any channel or thread with one click.",
    icon: Sparkles,
  },
] as const

const BillingStepCard = () => {
  const { data } = useSuspenseQuery(orpc.onboarding.state.queryOptions())
  const router = useRouter()
  const [selectedFeature, setSelectedFeature] =
    useState<(typeof FEATURES)[number]["id"]>("ai")

  const freeMutation = useMutation(
    orpc.onboarding.billing.startFree.mutationOptions({
      onSuccess: ({ redirectTo }) => {
        router.replace(redirectTo)
        router.refresh()
      },
      onError: (error) =>
        toast.error(error.message || "Unable to start free plan"),
    }),
  )

  const [startingCheckout, setStartingCheckout] = useState(false)
  const activeFeature = useMemo(
    () =>
      FEATURES.find((feature) => feature.id === selectedFeature) ?? FEATURES[3],
    [selectedFeature],
  )
  const startPro = async () => {
    if (!data.state.workspaceId) {
      toast.error("Create a workspace before starting checkout")
      return
    }

    setStartingCheckout(true)

    try {
      await authClient.checkout({
        slug: "pro",
        referenceId: data.state.workspaceId,
        metadata: {
          workspaceId: data.state.workspaceId,
          flow: "onboarding",
        },
      })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to start checkout",
      )
      setStartingCheckout(false)
    }
  }

  return (
    <OnboardingShell
      step={4}
      totalSteps={4}
      workspaceName={data.state.workspaceName ?? "New Workspace"}
      title="Start with TeamFlow Pro"
      description="Your workspace is ready to go."
    >
      <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-border">
            {FEATURES.map((feature) => {
              const selected = feature.id === selectedFeature
              const Icon = feature.icon
              return (
                <button
                  key={feature.id}
                  type="button"
                  onClick={() => setSelectedFeature(feature.id)}
                  className="cursor-pointer w-full border-b border-border px-4 py-4 text-left last:border-b-0 hover:bg-muted/60"
                >
                  <div className="flex items-start gap-4">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-primary">
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">
                        {feature.title}
                      </p>
                      {selected && (
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {feature.description}
                        </p>
                      )}
                    </div>
                    {selected ? (
                      <Check className="mt-1 ml-auto size-5 text-primary" />
                    ) : (
                      <ChevronRight className="mt-1 ml-auto size-5 text-muted-foreground" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="flex w-full gap-6 flex-col items-center">
            <Card className="w-full rounded-2xl border-primary/20 bg-primary text-primary-foreground shadow-xl shadow-primary/20">
              <CardContent className="space-y-5 p-5">
                <div>
                  <p className="text-2xl font-semibold">50% off 3 months</p>
                  <p className="text-base text-primary-foreground/75">
                    <span className="font-semibold">$4.38 USD</span> per
                    person/month
                  </p>
                </div>
                <Button
                  size="lg"
                  disabled={freeMutation.isPending || startingCheckout}
                  onClick={startPro}
                  className="h-12 w-full rounded-xl bg-accent text-base font-semibold text-accent-foreground hover:bg-accent/90"
                >
                  {startingCheckout ? "Opening checkout..." : "Start with Pro"}
                </Button>
              </CardContent>
            </Card>

            <Button
              size="lg"
              variant="secondary"
              disabled={freeMutation.isPending || startingCheckout}
              onClick={() => freeMutation.mutate()}
              className="h-12 w-full  rounded-xl text-base font-semibold"
            >
              {freeMutation.isPending
                ? "Starting free version..."
                : "Start with the Limited Free Version"}
            </Button>
          </div>
        </div>

        <div className="hidden border-l border-border pl-8 lg:block min-h-[400px]">
          <div className="min-h-[400px] flex flex-col rounded-2xl border border-border bg-background p-6 shadow-xl shadow-primary/10">
            <p className="text-sm font-medium text-muted-foreground">
              Plan preview
            </p>
            <div className="mt-4 flex-1 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground">
                  {activeFeature.title}
                </p>
                <ArrowUpRight className="size-4 text-primary" />
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {activeFeature.description}
              </p>
              <div className="mt-6 space-y-3">
                <div className="h-2.5 rounded-full bg-muted" />
                <div className="h-2.5 rounded-full bg-muted" />
                <div className="h-2.5 rounded-full bg-muted" />
                <div className="h-2.5 rounded-full bg-muted" />
                <div className="h-2.5 rounded-full bg-muted" />
                <div className="h-2.5 rounded-full bg-muted" />
                <div className="h-2.5 w-10/12 rounded-full bg-muted" />
                <div className="h-2.5 w-7/12 rounded-full bg-accent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </OnboardingShell>
  )
}

export default BillingStepCard
