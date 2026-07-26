import { UserSchema } from "@/app/schemas/realtime"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { useRequiredActiveWorkspace } from "@/hooks/use-active-workspace"
import { usePresence } from "@/hooks/use-presence"
import { orpc } from "@/lib/orpc/orpc"
import { useQuery } from "@tanstack/react-query"
import { Search, UsersIcon } from "lucide-react"
import { useMemo, useState } from "react"
import z from "zod"
import MemberItem from "./MemberItem"
import { workspaceQueryKeys } from "@/lib/query/workspace-query-keys"

const MembersOverview = () => {
  const { presenceRoom, user, workspaceId } = useRequiredActiveWorkspace()

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const {
    data: membersListData,
    isLoading,
    error,
  } = useQuery({
    ...orpc.member.list.queryOptions(),
    queryKey: workspaceQueryKeys.memberList(workspaceId),
  })

  const currentUser = useMemo(() => {
    return {
      id: user.id,
      full_name: user.name,
      email: user.email!,
      picture: user.image,
    } satisfies z.infer<typeof UserSchema>
  }, [user])

  const members = membersListData ?? []

  const query = search.trim().toLowerCase()

  const filteredMembers = query
    ? members.filter((member) => {
        const name = member.user.name.toLowerCase()
        const email = member.user.email.toLowerCase()

        return name.includes(query) || email.includes(query)
      })
    : members

  const { onlineUsers } = usePresence({
    room: presenceRoom,
    currentUser,
  })

  const onlineUserIds = useMemo(
    () => new Set(onlineUsers.map((user) => user.id)),
    [onlineUsers],
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="dark:hover:text-white">
          <UsersIcon />
          <span>Members</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-0 w-[300px]">
        <div className="p-0">
          {/* Header */}
          <div className="px-4 py-3 border-b">
            <h3 className="font-semibold text-sm ">Workspace Members</h3>
            <p className="text-xs text-muted-foreground">Members</p>
          </div>

          {error ? (
            <p className="px-4 py-6 text-destructive text-sm">
              Failed to load members: {error.message}
            </p>
          ) : (
            <>
              {/* Search */}
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="size-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search members..."
                    className="pl-9 h-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              {/* Members Info */}
              <div className="max-h-80 overflow-y-auto">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2">
                      <Skeleton className="size-8 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))
                ) : filteredMembers.length === 0 ? (
                  <p className="px-4 py-6 text-muted-foreground">
                    No members Found
                  </p>
                ) : (
                  filteredMembers.map((member) => (
                    <MemberItem
                      member={member}
                      key={member.id}
                      isOnline={
                        member.id ? onlineUserIds.has(member.id) : false
                      }
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default MembersOverview
