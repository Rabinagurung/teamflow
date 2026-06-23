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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authClient } from "@/lib/auth/auth-client"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export type AdminInvitation = {
  id: string
  email: string
  role: string | null
  status: string
  createdAt: Date | string
  expiresAt: Date | string
  user: {
    name: string
  }
}

type AdminInvitationsTabsProps = {
  invitations: AdminInvitation[]
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

const formatDate = (value: Date | string) => {
  return dateFormatter.format(new Date(value))
}

const AdminInvitationsTabs = ({ invitations }: AdminInvitationsTabsProps) => {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [invitationRows, setInvitationRows] = useState(invitations)

  const query = search.trim().toLowerCase()

  const filteredInvitations = query
    ? invitationRows.filter((invitation) =>
        invitation.email.toLowerCase().includes(query),
      )
    : invitationRows

  const pendingInvitations = filteredInvitations.filter(
    (invitation) => invitation.status === "pending",
  )
  const acceptedInvitations = filteredInvitations.filter(
    (invitation) => invitation.status === "accepted",
  )

  async function cancelInvitation(invitationId: string) {
    const result = await authClient.organization.cancelInvitation({
      invitationId,
    })

    if (!result.error) {
      setInvitationRows((current) =>
        current.filter((invitation) => invitation.id !== invitationId),
      )
      router.refresh()
    }

    return result
  }

  return (
    <Tabs defaultValue="pending" className="w-full gap-0">
      <div className="overflow-hidden rounded-[28px] border border-border/80 bg-card shadow-[0_20px_50px_-36px_rgba(15,23,42,0.35)]">
        <div className="border-b border-border/70 px-5 pt-4">
          <TabsList variant="line" className="border-b-0 px-0">
            <TabsTrigger
              value="pending"
              className="px-4 pb-4 pt-2 text-sm font-semibold"
            >
              Pending
            </TabsTrigger>
            <TabsTrigger
              value="accepted"
              className="px-4 pb-4 pt-2 text-sm font-semibold"
            >
              Accepted
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="border-b border-border/70 bg-muted/10 px-5 py-4">
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invitations by email"
              className="h-11 rounded-2xl border-border/70 bg-background pl-10 shadow-sm"
            />
          </div>
        </div>

        <TabsContent value="pending" className="mt-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/70 bg-muted/10 hover:bg-muted/10">
                <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
                  Email address
                </TableHead>
                <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
                  Invited by
                </TableHead>
                <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
                  Role
                </TableHead>
                <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
                  Status
                </TableHead>
                <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
                  Expires
                </TableHead>
                <TableHead className="h-12 px-5 text-right text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {pendingInvitations.length > 0 ? (
                pendingInvitations.map((invitation) => (
                  <TableRow
                    key={invitation.id}
                    className="border-border/60 transition-colors hover:bg-muted/10"
                  >
                    <TableCell className="px-5 py-4 font-medium text-foreground">
                      {invitation.email}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-foreground">
                      {invitation.user.name}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Badge
                        variant="outline"
                        className="rounded-full px-2.5 py-1"
                      >
                        {invitation.role ?? "Member"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Badge
                        variant="secondary"
                        className="rounded-full px-2.5 py-1 capitalize"
                      >
                        {invitation.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                      {formatDate(invitation.expiresAt)}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-right">
                      <BetterAuthActionButton
                        variant="destructive"
                        size="sm"
                        className="rounded-xl"
                        successMessage="Invitation canceled"
                        action={() => cancelInvitation(invitation.id)}
                      >
                        Cancel
                      </BetterAuthActionButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-5 py-12 text-center text-muted-foreground"
                  >
                    No pending invitations found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="accepted" className="mt-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/70 bg-muted/10 hover:bg-muted/10">
                <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
                  Email address
                </TableHead>
                <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
                  Invited by
                </TableHead>
                <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
                  Accepted on
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {acceptedInvitations.length > 0 ? (
                acceptedInvitations.map((invitation) => (
                  <TableRow
                    key={invitation.id}
                    className="border-border/60 transition-colors hover:bg-muted/10"
                  >
                    <TableCell className="px-5 py-4 font-medium text-foreground">
                      {invitation.email}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-foreground">
                      {invitation.user.name}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                      {formatDate(invitation.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="px-5 py-12 text-center text-muted-foreground"
                  >
                    No accepted invitations found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </div>
    </Tabs>
  )
}

export default AdminInvitationsTabs
