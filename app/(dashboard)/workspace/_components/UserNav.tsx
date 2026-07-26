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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const UserNav = () => {
  const { user, workspaceId } = useRequiredActiveWorkspace()

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button size="icon">
              <Avatar className="size-9 rounded-lg">
                <AvatarImage
                  src={getAvatar(user.image, user.email!)}
                  alt="User image"
                  className="object-cover"
                />
                <AvatarFallback className="rounded-lg">
                  {user.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>User Profile</p>
        </TooltipContent>
      </Tooltip>

      <UserMenuContent user={user} workspaceId={workspaceId} />
    </DropdownMenu>
  )
}

export default UserNav
