import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Plus } from "lucide-react"
import Link from "next/link"

export default function CreateWorkspaceCard() {
  return (
    <Link href="/onboarding/profile">
      {/* <Card className="rounded-2xl border-[#eadfce] bg-[#f4ebdf] transition hover:bg-[#efe3d3]"> */}
      <Card className="overflow-hidden rounded-2xl border-border shadow-sm">
        <CardContent className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="grid size-12 place-items-center rounded-xl bg-white text-black shadow-sm">
              <Plus className="size-6 " />
            </div>

            <span className="text-lg font-medium text-foreground">
              Create a new workspace
            </span>
          </div>

          <ArrowRight className="size-5 text-foreground" />
        </CardContent>
      </Card>
    </Link>
  )
}
