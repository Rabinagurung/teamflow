import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Plus } from "lucide-react"
import Link from "next/link"

export default function CreateWorkspaceCard() {
  return (
    <Link href="/onboarding/profile">
      <Card className="overflow-hidden rounded-xl border-border bg-card shadow-sm transition hover:border-primary/30 hover:bg-accent/40">
        <CardContent className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="grid size-12 place-items-center rounded-xl bg-accent text-primary shadow-sm">
              <Plus className="size-6" />
            </div>

            <span className="text-lg font-medium text-foreground">
              Create a new workspace
            </span>
          </div>

          <ArrowRight className="size-5 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  )
}
