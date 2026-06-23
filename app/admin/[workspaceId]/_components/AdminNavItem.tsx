"use client"

import { cn } from "@/lib/utlis/utils"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

type AdminNavItemProps = {
  href: string
  icon: LucideIcon
  children: React.ReactNode
  exact?: boolean
}

const AdminNavItem = ({
  href,
  icon: Icon,
  children,
  exact = false,
}: AdminNavItemProps) => {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        "group flex h-12 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-foreground transition-all hover:bg-muted/60",
        isActive &&
          "bg-background text-foreground shadow-sm ring-1 ring-border/70 hover:bg-background",
      )}
    >
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/70 text-muted-foreground transition-colors group-hover:bg-muted group-hover:text-foreground",
          isActive && "bg-secondary text-secondary-foreground",
        )}
      >
        <Icon className="size-4 shrink-0" />
      </div>
      <span className="truncate">{children}</span>
    </Link>
  )
}

export default AdminNavItem
