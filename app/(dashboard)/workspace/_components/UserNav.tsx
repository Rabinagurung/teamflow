"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRequiredActiveWorkspace } from "@/hooks/use-active-workspace"
import { getAvatar } from "@/lib/utlis/get-avatar"
import { LogoutLink, PortalLink } from "@kinde-oss/kinde-auth-nextjs/components"
import { CreditCardIcon, LogOut, User } from "lucide-react"

const UserNav = () => {
  const { user } = useRequiredActiveWorkspace()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className="size-12 rounded-xl border-workspace-rail-border bg-workspace-rail-accent 
          transition-all duration-200 hover:rounded-lg hover:bg-sidebar-accent hover:text-accent-foreground"
        >
          <Avatar>
            <AvatarImage
              src={getAvatar(user.picture, user.email!)}
              alt="User image"
              className="object-cover"
            />
            <AvatarFallback>
              {user.given_name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="right"
        sideOffset={8}
        className="w-[200px]"
      >
        <DropdownMenuLabel className="flex gap-2 items-center font-normal px-1 py-1.5 text-left text-sm">
          <Avatar className="relative size-8 rounded-lg">
            <AvatarImage
              src={getAvatar(user.picture, user.email!)}
              alt="User image"
              className="object-cover"
            />
            <AvatarFallback>
              {user.given_name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <p className="truncate font-medium ">{user.given_name}</p>
            <p className="text-muted-foreground truncate text-xs">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <PortalLink>
              <User />
              Account
            </PortalLink>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <PortalLink>
              <CreditCardIcon />
              Billing
            </PortalLink>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <LogoutLink>
            <LogOut />
            Log out
          </LogoutLink>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserNav
