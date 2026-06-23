"use client"

import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { authClient } from "@/lib/auth/auth-client"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export type AdminMembersTableMember = {
  id: string
  role: string
  user: {
    id: string
    name: string
    email: string
    image: string | null
  }
}

type AdminMembersTableProps = {
  members: AdminMembersTableMember[]
}

const formatMemberId = (id: string) => {
  return id.replaceAll("-", "").slice(0, 10).toUpperCase()
}

const AdminMembersTable = ({ members }: AdminMembersTableProps) => {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [memberRows, setMemberRows] = useState(members)
  const { data: session } = authClient.useSession()

  const query = search.trim().toLowerCase()

  const filteredMembers = query
    ? memberRows.filter((member) => {
        const name = member.user.name.toLowerCase()
        const email = member.user.email.toLowerCase()

        return name.includes(query) || email.includes(query)
      })
    : memberRows

  async function removeMember(memberId: string) {
    const result = await authClient.organization.removeMember({
      memberIdOrEmail: memberId,
    })

    if (!result.error) {
      setMemberRows((current) =>
        current.filter((member) => member.id !== memberId),
      )
      router.refresh()
    }

    return result
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-border/80 bg-card shadow-[0_20px_50px_-36px_rgba(15,23,42,0.35)]">
      <div className="flex flex-col gap-4 border-b border-border/70 bg-muted/20 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <span className="text-sm font-medium text-foreground">
            {memberRows.length} {memberRows.length === 1 ? "member" : "members"}
          </span>
        </div>

        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search members using name and email..."
            className="h-11 rounded-2xl border-border/70 bg-background pl-10 shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-border/70 bg-muted/10 hover:bg-muted/10">
            <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
              Member
            </TableHead>
            <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
              Member ID
            </TableHead>
            <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
              Email address
            </TableHead>
            <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
              Role
            </TableHead>
            <TableHead className="h-12 px-5 text-right text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredMembers.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="px-5 py-12 text-center text-muted-foreground"
              >
                No members found.
              </TableCell>
            </TableRow>
          ) : (
            filteredMembers.map((member) => {
              const isCurrentUser = member.user.id === session?.user.id

              return (
                <TableRow
                  key={member.id}
                  className="border-border/60 transition-colors hover:bg-muted/10"
                >
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-foreground">
                            {member.user.name}
                          </p>
                          {isCurrentUser ? (
                            <Badge
                              variant="secondary"
                              className="rounded-full px-2 py-0.5 text-[11px]"
                            >
                              You
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                    {formatMemberId(member.id)}
                  </TableCell>

                  <TableCell className="px-5 py-4 text-sm text-foreground">
                    {member.user.email}
                  </TableCell>

                  <TableCell className="px-5 py-4">
                    <Badge
                      variant={
                        member.role === "owner"
                          ? "default"
                          : member.role === "admin"
                            ? "secondary"
                            : "outline"
                      }
                      className="rounded-full px-2.5 py-1 capitalize"
                    >
                      {member.role}
                    </Badge>
                  </TableCell>

                  <TableCell className="px-5 py-4 text-right">
                    <BetterAuthActionButton
                      requireAreYouSure
                      variant="destructive"
                      size="sm"
                      className="rounded-xl"
                      disabled={isCurrentUser}
                      successMessage="Member removed"
                      action={() => removeMember(member.id)}
                    >
                      Remove
                    </BetterAuthActionButton>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default AdminMembersTable
