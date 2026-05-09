import { BetterAuthMember } from "@/app/router/member"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getAvatar } from "@/lib/utlis/get-avatar"
import { cn } from "@/lib/utlis/utils"
import Image from "next/image"

interface MemberItemProps {
  member: BetterAuthMember
  isOnline?: boolean
}

const badgeStyles = {
  admin:
    "bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30",
  user: "bg-gray-50 text-gray-700 ring-gray-700/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/30",
}

const MemberItem = ({ member, isOnline }: MemberItemProps) => {
  const isAdmin = member.role.includes("owner")

  return (
    <div className="px-3 py-2 hover:bg-accent cursor-pointer transition-colors">
      <div className="flex items-center space-x-3">
        <div className="relative ">
          <Avatar className="size-8">
            <Image
              src={getAvatar(member.user.image ?? null, member.user.email!)}
              alt="Member Avatar"
              fill
              className="object-cover"
            />
            <AvatarFallback>
              {member.user.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {/* Online/offline status */}
          <div
            className={cn(
              "absolute bottom-0 right-0 size-2.5 rounded-full",
              isOnline && "bg-green-500",
            )}
          ></div>
        </div>

        {/* Member Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium truncate">{member.user.name}</p>
            <span
              className={cn(
                "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                isAdmin ? badgeStyles.admin : badgeStyles.user,
              )}
            >
              {isAdmin ? "Admin" : "User"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {member.user.email}
          </p>
        </div>
      </div>
    </div>
  )
}

export default MemberItem
