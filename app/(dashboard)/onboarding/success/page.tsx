"use client"

import { orpc } from "@/lib/orpc/orpc"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import { getOnboardingErrorMessage } from "../_components/get-onboarding-error-message"
import { Button } from "@/components/ui/button"

export default function OnboardingSuccessPage() {
  const router = useRouter()
  const attempted = useRef(false)

  const { mutate, error, isError, isPending, isSuccess, reset } = useMutation(
    orpc.onboarding.billing.completePro.mutationOptions({
      onSuccess: ({ redirectTo }) => {
        router.replace(redirectTo)
        router.refresh()
      },
    }),
  )

  useEffect(() => {
    if (attempted.current || isPending || isSuccess) {
      return
    }

    attempted.current = true
    mutate()
  }, [isPending, isSuccess, mutate])

  const handleRetry = () => {
    reset()
    mutate()
  }

  if (isError) {
    return (
      <main className="grid min-h-screen place-items-center bg-background p-6 text-foreground">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-xl shadow-primary/10">
          <div className="mx-auto mb-5 size-12 rounded-2xl bg-destructive/10" />
          <p className="text-lg font-semibold">
            We couldn&apos;t finish your TeamFlow setup
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {getOnboardingErrorMessage(
              error,
              "We couldn't finish setting up your workspace. Please try again.",
            )}
          </p>

          <div className="mt-6 flex justify-center">
            <Button onClick={handleRetry}>Try again</Button>
          </div>
        </div>
      </main>
    )
  }

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
