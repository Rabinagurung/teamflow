"use client"

import OnboardingShell from "@/components/onboarding/OnboardingShell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { authClient } from "@/lib/auth/auth-client"
import { orpc } from "@/lib/orpc/orpc"
import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import {
  Check,
  History,
  Sparkles,
  Users,
  Video,
  ChevronRight,
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
    accent: "text-fuchsia-300",
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
      <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-6">
          <div className="space-y-0 border-t border-white/10">
            {FEATURES.map((feature) => {
              const selected = feature.id === selectedFeature
              // const Icon = feature.icon
              return (
                <button
                  key={feature.id}
                  type="button"
                  onClick={() => setSelectedFeature(feature.id)}
                  className="w-full border-b border-white/10 py-5 text-left"
                >
                  <div className="flex items-start gap-4">
                    {selected ? (
                      <Check className="mt-1 size-5 text-emerald-400" />
                    ) : (
                      <ChevronRight className="mt-1 size-5 text-white/60" />
                    )}
                    <div>
                      <p
                      // className={`text-2xl font-semibold ${feature.accent ?? "text-white"}`}
                      >
                        {feature.title}
                      </p>
                      {selected && (
                        <p className="mt-1 text-lg leading-8 text-white/60">
                          {feature.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <Card className="max-w-md rounded-3xl border-0 bg-[#6a2576] text-white shadow-xl">
            <CardContent className="space-y-5 p-5">
              <div>
                <p className="text-3xl font-semibold">50% off 3 months</p>
                <p className="text-lg text-white/75">
                  <span className="font-semibold">$4.38 USD</span> per
                  person/month
                </p>
              </div>
              <Button
                size="lg"
                disabled={freeMutation.isPending || startingCheckout}
                onClick={startPro}
                className="h-12 w-full rounded-xl bg-emerald-700 text-lg font-extrabold text-white hover:bg-emerald-600"
              >
                {startingCheckout ? "Opening checkout..." : "Start with Pro"}
              </Button>
            </CardContent>
          </Card>

          <Button
            size="lg"
            variant="outline"
            disabled={freeMutation.isPending || startingCheckout}
            onClick={() => freeMutation.mutate()}
            className="h-12 w-full max-w-md rounded-xl text-lg font-extrabold"
          >
            {freeMutation.isPending
              ? "Starting free version..."
              : "Start with the Limited Free Version"}
          </Button>
        </div>

        <div className="hidden border-l border-white/10 pl-8 lg:block">
          <div className="rounded-[24px] border border-white/10 bg-white p-6 shadow-2xl">
            <p className="text-sm font-medium text-zinc-500">
              {activeFeature.title}
            </p>
            <div className="mt-4 h-72 rounded-2xl bg-zinc-100" />
          </div>
        </div>
      </div>
    </OnboardingShell>
  )

  // return (
  //   <>
  //     <OnboardingShell
  //       step={4}
  //       totalSteps={4}
  //       workspaceName={data.state.workspaceName ?? "New Workspace"}
  //       title="Start with TeamFlow Pro"
  //       description="Your workspace is ready to go✨"
  //     >
  //       <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
  //         <div className="space-y-6">
  //           <div className="space-y-0 border-t border-white/10">
  //             {FEATURES.map((feature) => {
  //               const selected = feature.id === selectedFeature
  //               const Icon = feature.icon
  //               return (
  //                 <button
  //                   key={feature.id}
  //                   type="button"
  //                   onClick={() => setSelectedFeature(feature.id)}
  //                   className="w-full border-b border-white/10 py-5 text-left"
  //                 >
  //                   <div className="flex items-start gap-4">
  //                     {selected ? (
  //                       <Check className="mt-1 size-5 text-emerald-400" />
  //                     ) : (
  //                       <ChevronRight className="mt-1 size-5 text-white/60" />
  //                     )}
  //                     <div>
  //                       <p
  //                       // className={`text-2xl font-semibold ${feature.accent ?? "text-white"}`}
  //                       >
  //                         {feature.title}
  //                       </p>
  //                       {selected && (
  //                         <p className="mt-1 text-lg leading-8 text-white/60">
  //                           {feature.description}
  //                         </p>
  //                       )}
  //                     </div>
  //                   </div>
  //                 </button>
  //               )
  //             })}
  //           </div>

  //           <Card className="max-w-md rounded-3xl border-0 bg-[#6a2576] text-white shadow-xl">
  //             <CardContent className="space-y-5 p-5">
  //               <div className="flex items-start gap-4">
  //                 <div className="grid place-items-center rounded-2xl text-zinc-950 shadow-sm">
  //                   <p className="text-6xl">🎁</p>
  //                 </div>

  //                 <div>
  //                   <p className="text-3xl font-semibold">50% off 3 months</p>
  //                   <p className="text-lg text-white/75">
  //                     <span className="font-semibold">$4.38 USD</span> per
  //                     person/month
  //                   </p>
  //                 </div>
  //               </div>
  //               <Button
  //                 size="lg"
  //                 className="h-12 w-full rounded-xl bg-emerald-700 text-lg font-extrabold text-white hover:bg-emerald-600"
  //               >
  //                 {startingCheckout ? "Opening checkout..." : "Start with Pro"}
  //               </Button>
  //             </CardContent>
  //           </Card>

  //           <Button
  //             size="lg"
  //             variant="outline"
  //             onClick={() => freeMutation.mutate()}
  //             className="h-12 w-full  max-w-md rounded-xl text-lg font-extrabold hover:bg-white/5 hover:text-white"
  //           >
  //             {freeMutation.isPending
  //               ? "Starting free version..."
  //               : "Start with the Limited Free Version"}
  //           </Button>
  //         </div>

  //         <div className="hidden items-center justify-center border-l border-white/10 pl-8 lg:flex">
  //           {/* <div className="w-full max-w-sm rounded-[24px] border border-white/10 bg-white p-6 shadow-2xl">
  //             <div className="space-y-3">
  //               <div className="flex items-center justify-between text-xs text-zinc-400">
  //                 <span>AI Summary</span>
  //                 <span>Preview</span>
  //               </div>

  //               <div className="space-y-2">
  //                 <div className="h-3 w-3/4 rounded-full bg-zinc-200" />
  //                 <div className="h-3 w-2/3 rounded-full bg-zinc-100" />
  //                 <div className="h-3 w-5/6 rounded-full bg-zinc-100" />
  //               </div>

  //               <div className="rounded-xl border border-zinc-200 p-4">
  //                 <div className="space-y-3">
  //                   <div className="h-3 w-full rounded-full bg-zinc-200" />
  //                   <div className="h-3 w-10/12 rounded-full bg-zinc-100" />
  //                   <div className="h-3 w-8/12 rounded-full bg-zinc-100" />
  //                 </div>
  //               </div>
  //             </div>
  //           </div> */}
  //           <div className="rounded-[24px] border border-white/10 bg-white p-6 shadow-2xl">
  //             <p className="text-sm font-medium text-zinc-500">
  //               {activeFeature.title}
  //             </p>
  //             <div className="mt-4 h-72 rounded-2xl bg-zinc-100" />
  //           </div>
  //         </div>
  //       </div>
  //     </OnboardingShell>
  //   </>
  // )
}

export default BillingStepCard
