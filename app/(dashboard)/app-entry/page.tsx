import { client } from "@/lib/orpc/orpc"
import { redirect } from "next/navigation"

export default async function AppEntryPage() {
  //gives user's current onboarding step
  const result = await client.onboarding.entry()

  console.log("App ENTREY PAGE: ", { result })

  if (result.kind === "no-workspace") redirect("/no-workspace")
  if (result.kind === "onboarding") redirect(`/onboarding/${result.step}`)

  redirect("/get-started")
}
