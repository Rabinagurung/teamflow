"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserMenuContent } from "@/components/navigation/UserMenuContent"
import { useRequiredActiveWorkspace } from "@/hooks/use-active-workspace"
import { getAvatar } from "@/lib/utlis/get-avatar"

const UserNav = () => {
  const { user, workspaceId } = useRequiredActiveWorkspace()

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
              src={getAvatar(user.image, user.email!)}
              alt="User image"
              className="object-cover"
            />
            <AvatarFallback>
              {user.name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <UserMenuContent user={user} workspaceId={workspaceId} />
    </DropdownMenu>
  )
}

export default UserNav
