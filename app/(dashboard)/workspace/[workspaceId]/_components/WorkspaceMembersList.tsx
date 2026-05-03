"use client"

import { UserSchema } from "@/app/schemas/realtime"
import { Avatar } from "@/components/ui/avatar"
import { usePresence } from "@/hooks/use-presence"
import { getAvatar } from "@/lib/utils/get-avatar"
import { orpc } from "@/lib/orpc/orpc"
import { cn } from "@/lib/utils/utils"
import { AvatarFallback } from "@radix-ui/react-avatar"
import { useQuery, useSuspenseQuery } from "@tanstack/react-query"
import Image from "next/image"
import { useParams } from "next/navigation"
import { useMemo } from "react"
import { z } from "zod"

const WorkspaceMembersList = () => {
  const {
    data: { members },
  } = useSuspenseQuery(orpc.channel.list.queryOptions())

  const { data: workspaceData } = useQuery(orpc.workspace.list.queryOptions())
  const params = useParams<{ workspaceId: string }>()
  const workspaceId = params.workspaceId

  const currentUser = useMemo(() => {
    if (!workspaceData?.user) return null

    return {
      id: workspaceData.user.id,
      full_name: workspaceData.user.given_name,
      email: workspaceData.user.email!,
      picture: workspaceData.user.picture,
    } satisfies z.infer<typeof UserSchema>
  }, [workspaceData?.user])

  const { onlineUsers } = usePresence({
    room: workspaceId ? `workspace-${workspaceId}` : "",
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
          className="flex items-center px-3 py-2 space-x-3 hover:bg-accent cursor-pointer transition-colors "
        >
          <div className="relative">
            <Avatar className="size-8">
              <Image
                src={getAvatar(member.picture ?? null, member.email ?? "")}
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
          <div className="flex-1 min-w-0 ">
            <p className="text-sm font-medium truncate">{member.full_name}</p>
            {member.email && (
              <p className="text-xs text-muted-foreground truncate">
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
