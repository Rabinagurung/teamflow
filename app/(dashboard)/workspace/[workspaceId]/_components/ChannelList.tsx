"use client"

import { buttonVariants } from "@/components/ui/button"
import { useRequiredActiveWorkspace } from "@/hooks/use-active-workspace"
import { orpc } from "@/lib/orpc/orpc"
import { cn } from "@/lib/utlis/utils"
import { useSuspenseQuery } from "@tanstack/react-query"
import { Hash } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

const ChannelList = () => {
  const {
    data: { channels },
  } = useSuspenseQuery(orpc.channel.list.queryOptions())
  const { workspacePath } = useRequiredActiveWorkspace()
  const { channelId } = useParams<{ channelId: string }>()

  return (
    <div className="space-y-0.5 py-1">
      {channels.map((channel) => {
        const isActive = channelId === channel.id
        return (
          <Link
            key={channel.id}
            href={`${workspacePath}/channel/${channel.id}`}
            className={buttonVariants({
              variant: "ghost",
              className: cn(
                "h-7 w-full justify-start px-2 py-1 text-sidebar-foreground/80 hover:bg-white/10 hover:text-white dark:text-sidebar-foreground/80",
                isActive &&
                  "bg-sidebar-accent !text-sidebar-accent-foreground shadow-xs hover:bg-sidebar-accent hover:!text-sidebar-accent-foreground [&_svg]:!text-sidebar-accent-foreground",
              ),
            })}
          >
            <Hash className="size-4" />
            <span className="truncate">{channel.name}</span>
          </Link>
        )
      })}
    </div>
  )
}

export default ChannelList
