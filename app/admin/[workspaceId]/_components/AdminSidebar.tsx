"use client"

import type { AppWorkspace } from "@/app/schemas/workspace"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserMenuContent } from "@/components/navigation/UserMenuContent"
import { getAvatar } from "@/lib/utlis/get-avatar"
import { getWorkspaceColor } from "@/lib/utlis/get-workspace-color"
import { cn } from "@/lib/utlis/utils"

import {
  CreditCard,
  ExternalLink,
  Home,
  Mail,
  Settings,
  Users,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import AdminNavItem from "./AdminNavItem"

type AdminSidebarUser = {
  id: string
  name: string
  email: string
  image: string | null
}

type AdminSidebarProps = {
  workspace: AppWorkspace
  workspaceHomeHref: string
  adminUser: AdminSidebarUser
}

const AdminSidebar = ({
  workspace,
  workspaceHomeHref,
  adminUser,
}: AdminSidebarProps) => {
  const base = `/admin/${workspace.id}`

  return (
    <aside className="sticky top-0 flex h-screen w-80 flex-col border-r border-border/80 bg-card/95 backdrop-blur">
      <div className="mt-auto border-t border-border/80 px-4 py-4">
        <div className="space-y-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Workspace Admin
          </div>

          <div
            className={cn(
              "flex size-16 items-center justify-center rounded-3xl text-2xl font-semibold shadow-sm ring-1 ring-black/5",
              getWorkspaceColor(workspace.id),
            )}
          >
            <span>{workspace.name.charAt(0).toUpperCase()}</span>
          </div>

          <div className="space-y-2">
            <h2 className="truncate text-2xl font-semibold tracking-tight text-foreground">
              {workspace.name}
            </h2>

            <Link
              href={workspaceHomeHref}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Open in TeamFlow
              <ExternalLink className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Navigation
        </div>

        <AdminNavItem href={base} icon={Home} exact>
          Home
        </AdminNavItem>
        <AdminNavItem href={`${base}/members`} icon={Users}>
          Members
        </AdminNavItem>
        <AdminNavItem href={`${base}/invitations`} icon={Mail}>
          Invitations
        </AdminNavItem>
        <AdminNavItem href={`${base}/billing`} icon={CreditCard}>
          Billing
        </AdminNavItem>
        <AdminNavItem href={`${base}/settings`} icon={Settings}>
          Account settings
        </AdminNavItem>
      </nav>

      <div className="border-t border-border/80 px-4 py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-background/80 px-3 py-3 text-left text-foreground shadow-sm transition-all hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Avatar className="size-9 rounded-xl">
                <Image
                  src={getAvatar(adminUser.image, adminUser.email)}
                  alt="Admin user avatar"
                  className="object-cover"
                  fill
                  sizes="32px"
                />
                <AvatarFallback className="rounded-xl text-sm font-semibold">
                  {adminUser.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-none">
                  {adminUser.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {adminUser.email}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>

          <UserMenuContent
            user={adminUser}
            workspaceId={workspace.id}
            align="start"
            side="top"
            sideOffset={8}
          />
        </DropdownMenu>
      </div>
    </aside>
  )
}

export default AdminSidebar
