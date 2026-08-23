"use client"

import { Button } from "@/components/ui/button"
import { useMobileSidebar } from "@/providers/MobileSidebarProvider"
import { Menu } from "lucide-react"

type AdminMobileTopBarProps = {
  workspaceName: string
}

const AdminMobileTopBar = ({ workspaceName }: AdminMobileTopBarProps) => {
  const { toggle } = useMobileSidebar()

  return (
    <div className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border/80 bg-card/95 px-4 backdrop-blur lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="-ml-2 shrink-0"
        onClick={toggle}
        aria-label="Toggle admin navigation"
      >
        <Menu className="size-5" />
      </Button>
      <span className="truncate text-sm font-semibold text-foreground">
        {workspaceName}
      </span>
    </div>
  )
}

export default AdminMobileTopBar
