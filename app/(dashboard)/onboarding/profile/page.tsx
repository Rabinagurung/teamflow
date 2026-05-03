import { requireAuth } from "@/lib/auth/auth-utils"
import ProfileSetupForm from "./_components/ProfileSetupForm"

export default async function ProfileStepPage() {
  await requireAuth()

  return <ProfileSetupForm />
}
