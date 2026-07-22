"use client"

import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { PlanKey, POLAR_PLANS } from "@/lib/billing/plans"
import { orpc } from "@/lib/orpc/orpc"
import { useMutation, useQuery } from "@tanstack/react-query"

import {
  BotMessageSquare,
  FileText,
  History,
  PenLine,
  Sparkles,
} from "lucide-react"
import { useEffect } from "react"
import { toast } from "sonner"

const PLAN_ORDER: PlanKey[] = ["free", "pro"]

const PLAN_DESCRIPTIONS: Record<PlanKey, string> = {
  free: "For smaller workspaces getting started.",
  pro: "For teams that need unlimited history and advanced collaboration.",
}

const PLAN_FEATURES = {
  free: [
    {
      title: "90 days of message history",
      icon: History,
      available: true,
    },
    {
      title: "Echo AI Q&A assistant",
      icon: BotMessageSquare,
      available: true,
    },
    {
      title: "AI-powered thread summaries",
      icon: FileText,
      available: false,
    },
    {
      title: "AI-powered message polishing",
      icon: PenLine,
      available: false,
    },
    {
      title: "AI-powered thread polishing",
      icon: Sparkles,
      available: false,
    },
  ],
  pro: [
    {
      title: "Unlimited message history",
      icon: History,
      available: true,
    },
    {
      title: "Echo AI Q&A assistant",
      icon: BotMessageSquare,
      available: true,
    },
    {
      title: "AI-powered thread summaries",
      icon: FileText,
      available: true,
    },
    {
      title: "AI-powered message polishing",
      icon: PenLine,
      available: true,
    },
    {
      title: "AI-powered thread polishing",
      icon: Sparkles,
      available: true,
    },
  ],
} satisfies Record<
  PlanKey,
  Array<{
    title: string
    icon: typeof History
    available: boolean
  }>
>

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

type SubscriptionsTabProps = {
  workspaceId: string
}

type BillingActionErrorLike = {
  code?: string
  message?: string
}

const isBillingActionErrorLike = (
  error: unknown,
): error is BillingActionErrorLike => {
  return typeof error === "object" && error !== null
}

function getBillingActionErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (isBillingActionErrorLike(error)) {
    if (
      error.code === "FORBIDDEN" &&
      error.message === "WORKSPACE_BILLING_MANAGER_REQUIRED"
    ) {
      return "Only workspace owners or admins can manage billing."
    }

    if (error.code === "FORBIDDEN" && error.message === "NO_WORKSPACE") {
      return "You no longer have access to this workspace."
    }

    if (error.code === "UNAUTHORIZED") {
      return "Your session has expired. Please sign in again."
    }

    if (typeof error.message === "string" && error.message.length > 0) {
      return error.message
    }
  }

  return fallback
}

export const SubscriptionsTab = ({ workspaceId }: SubscriptionsTabProps) => {
  const billingQuery = useQuery({
    ...orpc.billing.get.queryOptions({
      input: {
        workspaceId,
      },
    }),
  })

  const checkoutMutation = useMutation(orpc.billing.checkout.mutationOptions())

  const portalMutation = useMutation(orpc.billing.portal.mutationOptions())

  const billing = billingQuery.data ?? null
  const isLoading = billingQuery.isLoading

  /**
   * create org
    -> org becomes active
    -> subscription tab loads
    -> useEffect calls GET /api/organizations/:id/billing
    -> getOrganizationBillingState()
    -> ensureOrganizationBillingRow()
    -> no row exists
    -> insert free billing row
    -> return free billing row
   */
  useEffect(() => {
    if (billingQuery.error) {
      toast.error("Failed to load billing")
    }
  }, [billingQuery.error])

  const currentPlanKey: PlanKey = billing?.plan ?? "free"
  const currentPlan = POLAR_PLANS[currentPlanKey]

  /**
  User clicks Upgrade to Pro
-> handleUpgrade runs in subscriptions-tab.tsx
-> POST /api/organizations/:id/billing/checkout
-> createOrganizationCheckout(organizationId)
-> requireOrganizationBillingManager(organizationId)
-> ensurePolarTeamCustomer(organizationId)
-> ensureOrganizationBillingRow(organizationId)
-> if no local billing row exists, create free row
-> if no Polar customer exists, create Polar team customer
-> update organization_billing.polarCustomerId
-> update organization_billing.polarCustomerExternalId
-> polarClient.checkouts.create(...)
-> checkout is created with externalCustomerId = organizationId
-> update organization_billing.billingManagerUserId
-> return checkout.url
-> frontend redirects with window.location.href = data.url
   */
  async function handleUpgrade() {
    try {
      const result = await checkoutMutation.mutateAsync({ workspaceId })
      console.log({ result })

      //url: 'https://sandbox.polar.sh/checkout/polar_c_7bdB0bFkieXMC7njkv8jotxCMstTjBFHKDPdg12BLuf'
      //takes the user to polarcheck out url
      window.location.href = result.url
      return { error: null }
    } catch (error) {
      return {
        error: {
          message: getBillingActionErrorMessage(
            error,
            "Failed to start checkout",
          ),
        },
      }
    }
  }

  async function handleManageBilling() {
    try {
      //console.log("MANAGE BILLING")
      const result = await portalMutation.mutateAsync({ workspaceId })

      window.location.href = result.url
      return { error: null }
    } catch (error) {
      return {
        error: {
          message: getBillingActionErrorMessage(
            error,
            "Failed to open billing portal",
          ),
        },
      }
    }
  }

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">
        Loading billing information...
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>

        <CardContent className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{currentPlan.name}</h3>
              <Badge variant="secondary">
                {currentPlan.priceUsd === 0
                  ? "Free"
                  : currencyFormatter.format(currentPlan.priceUsd)}
              </Badge>
              {billing?.status === "trailing" && (
                <Badge variant="outline">Cancels at period end</Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {PLAN_DESCRIPTIONS[currentPlanKey]}
            </p>

            {billing?.plan === "pro" && billing.currentPeriodEnd && (
              <p className="text-sm text-muted-foreground">
                {billing.cancelAtPeriodEnd ? "Cancels on " : "Renews on "}
                {new Date(billing.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </div>

          {currentPlanKey === "pro" && (
            <BetterAuthActionButton
              variant="outline"
              action={handleManageBilling}
              className="shrink-0"
            >
              Manage Billing
            </BetterAuthActionButton>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {PLAN_ORDER.map((planKey) => {
          const plan = POLAR_PLANS[planKey]
          const isCurrentPlan = currentPlanKey === planKey
          const isFreePlan = planKey === "free"
          const isProPlan = planKey === "pro"

          return (
            <Card
              key={plan.slug}
              className={isCurrentPlan ? "border-primary" : undefined}
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  {isCurrentPlan && <Badge>Current Plan</Badge>}
                </div>

                <CardDescription>{PLAN_DESCRIPTIONS[planKey]}</CardDescription>

                <div className="pt-2 text-2xl font-semibold">
                  {plan.priceUsd === 0
                    ? "$0"
                    : currencyFormatter.format(plan.priceUsd)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-foreground">
                  {PLAN_FEATURES[planKey].map((feature) => {
                    const Icon = feature.icon

                    return (
                      <li
                        key={feature.title}
                        className={
                          feature.available
                            ? "flex items-center gap-2"
                            : "flex items-center gap-2 text-muted-foreground/60"
                        }
                      >
                        {feature.available ? (
                          <Icon className="size-4 shrink-0" />
                        ) : (
                          <span className="flex size-4 shrink-0 items-center justify-center">
                            -
                          </span>
                        )}
                        <span>{feature.title}</span>
                      </li>
                    )
                  })}
                </ul>

                {isFreePlan && isCurrentPlan && (
                  <Button disabled className="w-full">
                    Current Plan
                  </Button>
                )}

                {isFreePlan && !isCurrentPlan && billing?.cancelAtPeriodEnd && (
                  <Button disabled variant="outline" className="w-full">
                    Starts after Pro ends
                  </Button>
                )}

                {isFreePlan &&
                  !isCurrentPlan &&
                  !billing?.cancelAtPeriodEnd && (
                    <Button disabled variant="outline" className="w-full">
                      Free Default Plan
                    </Button>
                  )}

                {isProPlan && !isCurrentPlan && (
                  <BetterAuthActionButton
                    action={handleUpgrade}
                    className="w-full"
                  >
                    Upgrade to Pro
                  </BetterAuthActionButton>
                )}

                {isProPlan && isCurrentPlan && (
                  <Button disabled className="w-full">
                    Current Plan
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
