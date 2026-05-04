"use client"

import { useHasActiveSubscription } from "@/components/subscriptions/hooks/use-subscription"
import { orpc } from "@/lib/orpc/orpc"
import { useMutation } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

export default function OnboardingSuccessPage() {
  const router = useRouter()
  const attempted = useRef(false)
  const { hasActiveSubscription, isLoading } = useHasActiveSubscription()

  const completeMutation = useMutation(
    orpc.onboarding.billing.completePro.mutationOptions({
      onSuccess: ({ redirectTo }) => {
        router.replace(redirectTo)
        router.refresh()
      },
    }),
  )

  useEffect(() => {
    if (
      isLoading ||
      !hasActiveSubscription ||
      attempted.current ||
      completeMutation.isPending
    ) {
      return
    }
    attempted.current = true
    completeMutation.mutate()
  }, [isLoading, hasActiveSubscription, completeMutation])

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-xl shadow-primary/10">
        <div className="mx-auto mb-5 size-12 rounded-2xl bg-accent" />
        <p className="text-lg font-semibold">
          Finishing your TeamFlow setup...
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;re getting your workspace ready.
        </p>
      </div>
    </main>
  )
}
