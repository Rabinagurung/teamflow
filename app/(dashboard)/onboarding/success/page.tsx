"use client"

import { orpc } from "@/lib/orpc/orpc"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import { getOnboardingErrorMessage } from "../_components/get-onboarding-error-message"
import { Button } from "@/components/ui/button"
import OnboardingProcessingState from "../_components/OnboardingProcessingState"

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
      <main className="min-h-screen bg-background p-4 text-foreground sm:p-5">
        <div className="min-h-[calc(100vh-32px)] overflow-hidden rounded-2xl border border-border bg-secondary/60 shadow-2xl shadow-primary/10 sm:min-h-[calc(100vh-40px)]">
          <section className="flex min-h-[calc(100vh-32px)] items-center justify-center px-4 py-10 sm:min-h-[calc(100vh-40px)] sm:px-10 lg:px-16">
            <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-xl shadow-primary/5 sm:p-8">
              <div className="mx-auto flex max-w-md flex-col items-center text-center">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  We couldn&apos;t finish your TeamFlow setup
                </h1>

                <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
                  {getOnboardingErrorMessage(
                    error,
                    "We couldn't finish setting up your workspace. Please try again.",
                  )}
                </p>

                <div className="mt-8 flex w-full justify-center">
                  <Button onClick={handleRetry} className="min-w-36">
                    Try again
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <OnboardingProcessingState
      eyebrow="Confirming your upgrade"
      title="Finishing your TeamFlow setup..."
      description="We’re confirming your Pro workspace and getting everything ready for your first session."
    />
  )
}
