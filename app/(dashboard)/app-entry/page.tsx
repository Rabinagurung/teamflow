import { orpc } from "@/lib/orpc/orpc"
import { getQueryClient } from "@/lib/query/hydration"
import { redirect } from "next/navigation"

export default async function AppEntryPage() {
  //gives user's current onboarding step
  const queryClient = getQueryClient()

  const result = await queryClient.fetchQuery(
    orpc.onboarding.entry.queryOptions(),
  )

  // console.log("App ENTREY PAGE: ", { result })

  if (result.kind === "no-workspace") redirect("/no-workspace")
  if (result.kind === "onboarding") redirect(`/onboarding/${result.step}`)

  redirect("/get-started")
}
