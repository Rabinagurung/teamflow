export const POLAR_PLANS = {
  free: {
    slug: "free",
    name: "Free",
    priceUsd: 0,
  },
  pro: {
    slug: "pro",
    name: "Pro",
    priceUsd: 25,
  },
} as const

export type PlanKey = keyof typeof POLAR_PLANS
// export type PaidPlan = (typeof POLAR_PLANS)[number];
// export type PaidPlanSlug = PaidPlan["slug"];

// export function getPlanBySlug(slug: PaidPlanSlug) {
//   const plan = POLAR_PLANS.find((item) => item.slug === slug);

//   if (!plan) throw new Error(`Unknown plan slug: ${slug}`);

//   return plan;
// }

// export function getPlanByProductId(productId: string) {
//   return POLAR_PLANS.find((item) => item.productId === productId) ?? null;
// }
