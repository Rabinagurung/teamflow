"use client"

import { Button } from "@/components/ui/button"
import { useMobileSidebar } from "@/providers/MobileSidebarProvider"
import { Menu } from "lucide-react"

export default function MobileSidebarToggle() {
  const { toggle } = useMobileSidebar()

  return (
    <Button
      variant="ghost"
      size="icon"
      className="-ml-2 shrink-0 lg:hidden"
      onClick={toggle}
      aria-label="Toggle channel sidebar"
    >
      <Menu className="size-5" />
    </Button>
  )
}
