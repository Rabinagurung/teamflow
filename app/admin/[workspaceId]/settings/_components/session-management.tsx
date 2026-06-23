"use client"

import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { authClient } from "@/lib/auth/auth-client"
import { Session } from "better-auth"
import { Laptop2, Smartphone, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { UAParser } from "ua-parser-js"

interface SessionManagementProps {
  sessions: Session[]
  currentSessionToken: string
}

interface SessionCardProps {
  session: Session
  isCurrentSession?: boolean
}

export default function SessionManagement({
  sessions,
  currentSessionToken,
}: SessionManagementProps) {
  const router = useRouter()

  const otherSessions = sessions.filter(
    (session) => session.token !== currentSessionToken,
  )

  const currentSession = sessions.find(
    (session) => session.token === currentSessionToken,
  )

  function revokeOtherSessions() {
    return authClient.revokeOtherSessions(undefined, {
      onSuccess: () => {
        router.refresh()
      },
    })
  }

  return (
    <div className="space-y-6">
      {currentSession ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
              Current session
            </p>
            <p className="text-sm text-muted-foreground">
              This is the browser and device you&apos;re using right now.
            </p>
          </div>
          <SessionCard session={currentSession} isCurrentSession />
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-foreground">
              Other active sessions
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Revoke any browser or device you no longer recognize.
            </p>
          </div>

          {otherSessions.length > 0 ? (
            <BetterAuthActionButton
              variant="destructive"
              size="sm"
              className="rounded-xl"
              action={revokeOtherSessions}
              successMessage="Sessions revoked"
            >
              Revoke Other Sessions
            </BetterAuthActionButton>
          ) : null}
        </div>

        {otherSessions.length === 0 ? (
          <Card className="rounded-2xl border-border/70 bg-muted/15 shadow-none">
            <CardContent className="py-8 text-center text-muted-foreground">
              No other active sessions
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {otherSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SessionCard({ session, isCurrentSession = false }: SessionCardProps) {
  const router = useRouter()

  const userAgentInfo = session.userAgent ? UAParser(session.userAgent) : null

  function getBrowserInformation() {
    if (userAgentInfo == null) return "Unknown Device"
    if (userAgentInfo.browser.name == null && userAgentInfo.os.name == null)
      return "Unknown Device"

    if (userAgentInfo.browser.name == null) return userAgentInfo.os.name
    if (userAgentInfo.os.name == null) return userAgentInfo.browser.name

    return `${userAgentInfo.browser.name}, ${userAgentInfo.os.name}`
  }

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date))
  }

  function revokeSession() {
    return authClient.revokeSession(
      {
        token: session.token,
      },
      {
        onSuccess: () => {
          router.refresh()
        },
      },
    )
  }

  return (
    <Card className="rounded-2xl border-border/70 bg-muted/10 shadow-none">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl border border-border/70 bg-background shadow-sm">
            {userAgentInfo?.device.type === "mobile" ? (
              <Smartphone className="size-5 text-foreground" />
            ) : (
              <Laptop2 className="size-5 text-foreground" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-foreground">
                {getBrowserInformation()}
              </p>
              {isCurrentSession ? (
                <Badge className="rounded-full px-2.5 py-1">Current</Badge>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              Created: {formatDate(session.createdAt)}
            </p>
            <p className="text-sm text-muted-foreground">
              Expires: {formatDate(session.expiresAt)}
            </p>
          </div>
        </div>

        {!isCurrentSession ? (
          <BetterAuthActionButton
            variant="destructive"
            size="sm"
            className="rounded-xl"
            action={revokeSession}
            successMessage="Session revoked"
          >
            <Trash2 />
            Revoke
          </BetterAuthActionButton>
        ) : null}
      </CardContent>
    </Card>
  )
}
