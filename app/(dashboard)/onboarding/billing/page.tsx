import { requireAuth } from "@/lib/auth/auth-utils"
import BillingStepCard from "./_components/BillingStepCard"

export default async function BillingStepPage() {
  await requireAuth()

  return <BillingStepCard />
}
