"use client"

import { UserSchema } from "@/app/schemas/realtime"
import { Avatar } from "@/components/ui/avatar"
import { useRequiredActiveWorkspace } from "@/hooks/use-active-workspace"
import { usePresence } from "@/hooks/use-presence"
import { orpc } from "@/lib/orpc/orpc"
import { workspaceQueryKeys } from "@/lib/query/workspace-query-keys"
import { getAvatar } from "@/lib/utlis/get-avatar"
import { cn } from "@/lib/utlis/utils"
import { AvatarFallback } from "@radix-ui/react-avatar"
import { useSuspenseQuery } from "@tanstack/react-query"
import Image from "next/image"
import { useMemo } from "react"
import { z } from "zod"

const WorkspaceMembersList = () => {
  const { presenceRoom, user, workspaceId } = useRequiredActiveWorkspace()
  const {
    data: { members },
  } = useSuspenseQuery({
    ...orpc.channel.list.queryOptions(),
    queryKey: workspaceQueryKeys.channelList(workspaceId),
  })

  const currentUser = useMemo(() => {
    return {
      id: user.id,
      full_name: user.name,
      email: user.email!,
      picture: user.image,
    } satisfies z.infer<typeof UserSchema>
  }, [user])

  const { onlineUsers } = usePresence({
    room: presenceRoom,
    currentUser,
  })

  const onlineUserIds = useMemo(
    () => new Set(onlineUsers.map((user) => user.id)),
    [onlineUsers],
  )

  return (
    <div className="space-y-0.5 py-1">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex cursor-pointer items-center space-x-3 px-3 py-2 text-sidebar-foreground/90 transition-colors hover:bg-white/10 hover:text-white"
        >
          <div className="relative">
            <Avatar className="size-8">
              <Image
                src={getAvatar(member.picture ?? null, member.email!)}
                alt="User Image"
                className="object-cover"
                fill
                sizes="32px"
              />
              <AvatarFallback>
                {member.full_name?.charAt(0).toUpperCase() ?? ""}
              </AvatarFallback>
            </Avatar>
            {/* Online/offline status */}
            <div
              className={cn(
                "absolute bottom-0 right-0 size-2.5 rounded-full",
                member.id && onlineUserIds.has(member.id) && "bg-green-500",
              )}
            ></div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{member.full_name}</p>
            {member.email && (
              <p className="truncate text-xs text-sidebar-foreground/65">
                {member.email}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default WorkspaceMembersList
