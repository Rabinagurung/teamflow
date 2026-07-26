"use client"

import { Button } from "@/components/ui/button"
import { useRequiredActiveWorkspace } from "@/hooks/use-active-workspace"
import { orpc } from "@/lib/orpc/orpc"
import { useQuery } from "@tanstack/react-query"
import { Rocket } from "lucide-react"
import Link from "next/link"

const UpgradePlan = () => {
  const { workspaceId, canManageWorkspace } = useRequiredActiveWorkspace()

  const billingQuery = useQuery({
    ...orpc.billing.get.queryOptions({
      input: { workspaceId },
    }),
    enabled: canManageWorkspace && !!workspaceId,
    refetchOnWindowFocus: true,
  })

  if (!canManageWorkspace) {
    return null
  }

  if (billingQuery.data && billingQuery.data.plan !== "free") {
    return null
  }

  const billingHref = `/admin/${workspaceId}/billing`

  return (
    <Link target="_blank" rel="noopener noreferrer" href={billingHref}>
      <Button
        variant="outline"
        className="w-full border-white/15 bg-white/8 text-sidebar-foreground hover:bg-white/14 hover:text-white"
      >
        <Rocket className="size-4" />
        <span className="font-semibold text-sm">Upgrade Plan</span>
      </Button>
    </Link>
  )
}

export default UpgradePlan
