import { requireAuth } from "@/lib/auth/auth-utils"
import WorkspaceStepForm from "./_components/WorkspaceStepForm"

export default async function WorkspaceStepPage() {
  await requireAuth()

  return <WorkspaceStepForm />
}
