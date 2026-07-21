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
import { useQuery } from "@tanstack/react-query"

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

async function readJsonSafely<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get("content-type") ?? ""

  if (!contentType.includes("application/json")) {
    return null
  }

  return (await response.json()) as T
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

type SubscriptionsTabProps = {
  workspaceId: string
}

export const SubscriptionsTab = ({ workspaceId }: SubscriptionsTabProps) => {
  const billingQuery = useQuery({
    ...orpc.billing.get.queryOptions({
      input: {
        workspaceId,
      },
    }),
  })

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
      const response = await fetch(
        `/api/organizations/${workspaceId}/billing/checkout`,
        { method: "POST" },
      )

      //console.log({ response })
      const data = await readJsonSafely<{ url?: string; message?: string }>(
        response,
      )

      //console.log({ data })

      if (!response.ok || !data?.url) {
        return {
          error: { message: data?.message ?? "Failed to start checkout" },
        }
      }

      //url: 'https://sandbox.polar.sh/checkout/polar_c_7bdB0bFkieXMC7njkv8jotxCMstTjBFHKDPdg12BLuf'
      //takes the user to polarcheck out url
      window.location.href = data.url
      return { error: null }
    } catch {
      return { error: { message: "Failed to start checkout" } }
    }
  }

  async function handleManageBilling() {
    try {
      //console.log("MANAGE BILLING")
      const response = await fetch(
        `/api/organizations/${workspaceId}/billing/portal`,
        { method: "POST" },
      )
      //console.log({ response })

      const data = await readJsonSafely<{ url?: string; message?: string }>(
        response,
      )
      //console.log({ data })

      if (!response.ok || !data?.url) {
        return {
          error: { message: data?.message ?? "Failed to open billing portal" },
        }
      }

      window.location.href = data.url
      return { error: null }
    } catch {
      return { error: { message: "Failed to open billing portal" } }
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

              {/* <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {PLAN_FEATURES[planKey].map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                {planKey === "free" && isCurrentPlan && (
                  <Button disabled className="w-full">
                    Current Plan
                  </Button>
                )}

                {planKey === "free" &&
                  !isCurrentPlan &&
                  billing?.cancelAtPeriodEnd && (
                    <Button disabled variant="outline" className="w-full">
                      Starts after cancellation
                    </Button>
                  )}

                {planKey === "free" &&
                  !isCurrentPlan &&
                  !billing?.cancelAtPeriodEnd && (
                    <Button disabled variant="outline" className="w-full">
                      Free fallback plan
                    </Button>
                  )}

                {planKey === "pro" && !isCurrentPlan && (
                  <BetterAuthActionButton
                    action={handleUpgrade}
                    className="w-full"
                  >
                    Upgrade to Pro
                  </BetterAuthActionButton>
                )}

                {planKey === "pro" && isCurrentPlan && (
                  <BetterAuthActionButton
                    variant="outline"
                    action={handleManageBilling}
                    className="w-full"
                  >
                    {billing?.cancelAtPeriodEnd
                      ? "Manage Cancellation"
                      : "Manage Billing"}
                  </BetterAuthActionButton>
                )}
              </CardContent> */}

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

  /**

  const activePlan = POLAR_PLANS.find(
    (plan) => plan.productId === activeSubscription?.productId
  )//console.log({ activePlan });

  return be back where I currently ended my page

  if plan is gonna get canceled at end of period -> disabled button telling current plan
  else cancel subscription button

  check if user is member of given organization(referenceId)
  async function handleBillingPortal() {
    if (activeOrganization == null) {
      return { error: { message: "No active organization" } };
    }

    const res = await authClient.customer.portal();

    if (res.error == null) {
      window.location.href = res.data.url;
    }

    return res;
  }

  function handleSubscriptionChange(plan: PolarPlan) {
    if (activeOrganization == null) {
      return Promise.resolve({ error: { message: "No active organization" } });
    }//console.log({ activeSubscription });

    return authClient.checkout({
      // Any Polar Product ID can be passed here
      products: [plan.productId],
      // Or, if you setup "products" in the Checkout Config, you can pass the slug
      slug: plan.slug,
      // Reference ID will be saved as `referenceId` in the metadata of the checkout, order & subscription object
      referenceId: activeOrganization.id,
    });
  }
  */

  // return (
  //   <div className="space-y-6">
  //     {activeSubscription && activePlan && (
  //       <Card>
  //         <CardHeader>
  //           <CardTitle>Current Subscription</CardTitle>
  //         </CardHeader>

  //         <CardContent>
  //           <div className="flex items-center justify-between">
  //             <div className="space-y-1">
  //               <div className="flex items-center gap-2">
  //                 <h3 className="text-lg font-semibold capitalize">
  //                   {activePlan.slug} Plan
  //                 </h3>
  //                 {activeSubscription.amount && (
  //                   <Badge variant="secondary">
  //                     {currencyFormatter.format(PLAN_TO_PRICE[activePlan.slug])}
  //                   </Badge>
  //                 )}
  //               </div>
  //               <p className="text-sm text-muted-foreground mt-1">
  //                 {/* {activePlan.limits.projects} projects included */}
  //               </p>
  //               {activeSubscription.cancelAtPeriodEnd && (
  //                 <p className="text-sm text-muted-foreground">
  //                   {activeSubscription.cancelAtPeriodEnd
  //                     ? "Cancels on "
  //                     : "Renews on "}
  //                   {activeSubscription.currentPeriodEnd.toLocaleDateString()}
  //                 </p>
  //               )}
  //             </div>
  //             <BetterAuthActionButton
  //               variant="outline"
  //               action={handleBillingPortal}
  //               className="flex items-center gap-2"
  //             >
  //               Billing Portal
  //             </BetterAuthActionButton>
  //           </div>
  //         </CardContent>
  //       </Card>
  //     )}

  //     <div className="grid gap-4 md:grid-cols-2">
  //       {POLAR_PLANS.map((plan) => (
  //         <Card key={plan.slug}>
  //           <CardHeader>
  //             <div className="flex items-center justify-between">
  //               <CardTitle className="text-xl capitalize">
  //                 {plan.slug}
  //               </CardTitle>
  //               <div className="text-right">
  //                 <div>
  //                   {currencyFormatter.format(PLAN_TO_PRICE[plan.slug])}
  //                 </div>
  //               </div>
  //             </div>
  //             <CardDescription>{plan.description}</CardDescription>
  //           </CardHeader>

  //           <CardContent>
  //             {activeSubscription?.productId === plan.productId ? (
  //               //  !activeSubscription.cancelAtPeriodEnd ? (
  //               //    <Button disabled className="w-full">
  //               //      Current Plan
  //               //    </Button>
  //               //  ) : (
  //               <BetterAuthActionButton
  //                 variant="destructive"
  //                 className="w-full"
  //                 action={() => authClient.customer.portal()}
  //               >
  //                 Cancel Subscription
  //               </BetterAuthActionButton>
  //             ) : (
  //               //)
  //               <BetterAuthActionButton
  //                 action={() => handleSubscriptionChange(plan)}
  //                 className="w-full"
  //               >
  //                 {activeSubscription == null
  //                   ? "Subscribe"
  //                   : "Upgrade to Pro Plan"}
  //               </BetterAuthActionButton>
  //             )}
  //           </CardContent>
  //         </Card>
  //       ))}
  //     </div>
  //   </div>
  // );
}
