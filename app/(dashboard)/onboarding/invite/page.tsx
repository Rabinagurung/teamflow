import { requireAuth } from "@/lib/auth/auth-utils"
import InviteStepForm from "./_components/InviteStepForm"

export default async function InviteStepPage() {
  await requireAuth()

  return <InviteStepForm />
}
