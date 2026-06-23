"use client"

import Link from "next/link"
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { authClient } from "@/lib/auth/auth-client"
import { getAvatar } from "@/lib/utlis/get-avatar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, User } from "lucide-react"
import { useRouter } from "next/navigation"

type UserMenuContentProps = {
  user: {
    name: string
    email: string
    image: string | null
  }
  workspaceId: string
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
  sideOffset?: number
}

export function UserMenuContent({
  user,
  workspaceId,
  align = "end",
  side = "right",
  sideOffset = 8,
}: UserMenuContentProps) {
  const router = useRouter()
  const accountHref = `/admin/${workspaceId}/settings`

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <DropdownMenuContent
      align={align}
      side={side}
      sideOffset={sideOffset}
      className="w-[320px] rounded-[22px] border border-border/80 p-2.5 shadow-xl"
    >
      <div className="rounded-2xl border border-border/70 bg-muted/25 px-3.5 py-3">
        <DropdownMenuLabel className="p-0 text-left text-[15px] font-semibold">
          Profile Details
        </DropdownMenuLabel>

        <div className="mt-2 flex items-center gap-3 text-left">
          <Avatar className="relative size-11 rounded-2xl">
            <AvatarImage
              src={getAvatar(user.image, user.email)}
              alt="User image"
              className="object-cover"
            />
            <AvatarFallback className="rounded-2xl text-sm font-semibold">
              {user.name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="grid min-w-0 flex-1 gap-0.5 text-left">
            <p className="truncate text-sm font-medium leading-none">
              {user.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
      </div>

      <DropdownMenuSeparator className="my-2" />

      <DropdownMenuGroup>
        <DropdownMenuItem asChild className="rounded-xl p-0 focus:bg-accent">
          <Link
            target="_blank"
            rel="noopener noreferrer"
            href={accountHref}
            className="flex w-full items-start gap-3 rounded-2xl px-3 py-3"
          >
            <div className="rounded-xl border border-border/70 bg-background p-2.5 shadow-sm">
              <User className="size-4" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-none">Account</p>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                Update your profile and account settings
              </p>
            </div>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => void handleSignOut()}
          className="rounded-xl p-0 focus:bg-accent"
        >
          <div className="flex w-full items-start gap-3 rounded-2xl px-3 py-3">
            <div className="rounded-xl border border-border/70 bg-background p-2.5 shadow-sm">
              <LogOut className="size-4" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-none">Log out</p>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                Sign out of this account
              </p>
            </div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  )
}
