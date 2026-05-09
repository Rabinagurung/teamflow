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

  return <div className="p-10">Finishing your TeamFlow Pro setup...</div>
}
