"use client"

import { useMobileSidebar } from "@/providers/MobileSidebarProvider"
import { cn } from "@/lib/utlis/utils"

export default function ChannelSidebar({
  children,
}: {
  children: React.ReactNode
}) {
  const { isOpen, close } = useMobileSidebar()

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 flex h-dvh min-h-0 w-80 flex-col overflow-hidden overscroll-none border-r border-channel-sidebar-border bg-channel-sidebar shadow-sm transition-transform duration-200 ease-in-out lg:static lg:z-auto lg:h-full lg:translate-x-0 lg:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {children}
      </div>
    </>
  )
}
