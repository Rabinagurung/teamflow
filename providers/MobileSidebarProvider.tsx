"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { usePathname } from "next/navigation"

type MobileSidebarContextValue = {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const MobileSidebarContext = createContext<MobileSidebarContextValue | null>(
  null,
)

export function MobileSidebarProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Close the drawer whenever the user navigates to a different channel.
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent the page behind the drawer from scrolling while it's open.
  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  return (
    <MobileSidebarContext.Provider
      value={{
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        toggle: () => setIsOpen((prev) => !prev),
      }}
    >
      {children}
    </MobileSidebarContext.Provider>
  )
}

export function useMobileSidebar() {
  const context = useContext(MobileSidebarContext)
  if (!context) {
    throw new Error(
      "useMobileSidebar must be used within a MobileSidebarProvider",
    )
  }
  return context
}
