"use client"

import { inviteEmailSchema } from "@/app/schemas/invitations"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utlis/utils"
import { AlertTriangle, Mail, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

const splitTokens = (value: string) =>
  value
    .split(/[\s,;]+/g)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

export type InviteEmailChip = {
  value: string
  error: string | null
}

const getInviteEmailDiagnostics = (values: string[]) => {
  const chips: InviteEmailChip[] = values
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .map((value) => {
      const parsed = inviteEmailSchema.safeParse(value)

      return {
        value: parsed.success ? parsed.data : value,
        error: parsed.success ? null : "Enter a valid email address",
      }
    })

  return {
    chips,
    validEmails: chips.filter((chip) => !chip.error).map((chip) => chip.value),
    invalidChips: chips.filter((chip) => chip.error),
    hasErrors: chips.some((chip) => chip.error),
  }
}

interface InviteEmailsInputProps {
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
}

export default function InviteEmailsInput({
  value,
  onChange,
  disabled,
}: InviteEmailsInputProps) {
  const [draft, setDraft] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const diagnostics = useMemo(() => getInviteEmailDiagnostics(value), [value])

  const commitTokens = (tokens: string[]) => {
    if (tokens.length === 0) return
    onChange([...value, ...tokens])
  }

  const commitDraft = () => {
    const tokens = splitTokens(draft)

    if (tokens.length === 0) {
      setDraft("")
      return
    }

    commitTokens(tokens)
    setDraft("")
  }

  const removeChipAt = (index: number) => {
    onChange(value.filter((_, currentIndex) => currentIndex !== index))
  }

  const clearInvalidChips = () => {
    onChange(diagnostics.validEmails)
  }

  useEffect(() => {
    const container = scrollAreaRef.current
    if (!container) return

    container.scrollTop = container.scrollHeight
  }, [value, draft])

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "rounded-2xl border border-input bg-background px-3 py-3 shadow-sm transition",
          "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20",
          diagnostics.hasErrors &&
            "border-destructive/60 focus-within:border-destructive focus-within:ring-destructive/15",
          disabled && "opacity-70",
        )}
      >
        <div
          ref={scrollAreaRef}
          className="max-h-[160px] space-y-3 overflow-y-auto pr-1"
        >
          {diagnostics.chips.length > 0 ? (
            <div className="flex flex-wrap content-start gap-2">
              {diagnostics.chips.map((chip, index) => (
                <Badge
                  key={`${chip.value}-${index}`}
                  variant="outline"
                  className={cn(
                    "h-8 max-w-full gap-2 rounded-md border px-2.5 text-sm font-medium",
                    chip.error
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : "border-border bg-muted text-foreground",
                  )}
                >
                  {chip.error ? (
                    <AlertTriangle className="size-3.5 shrink-0" />
                  ) : (
                    <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                  )}

                  <span className="max-w-[320px] truncate">{chip.value}</span>

                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => removeChipAt(index)}
                    className="rounded-sm opacity-70 transition hover:opacity-100 disabled:pointer-events-none"
                    aria-label={`Remove ${chip.value}`}
                  >
                    <X className="size-3.5" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : null}

          <Input
            value={draft}
            disabled={disabled}
            onChange={(event) => {
              const nextValue = event.target.value
              const shouldCommit =
                /[\s,;]$/.test(nextValue) && splitTokens(nextValue).length > 0

              if (shouldCommit) {
                commitTokens(splitTokens(nextValue))
                setDraft("")
                return
              }

              setDraft(nextValue)
            }}
            onBlur={commitDraft}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === "Tab") {
                event.preventDefault()
                commitDraft()
              }

              if (
                event.key === "Backspace" &&
                draft.length === 0 &&
                value.length > 0
              ) {
                removeChipAt(value.length - 1)
              }
            }}
            placeholder={
              draft.length === 0 && diagnostics.chips.length === 0
                ? "alex@company.com, maria@company.com"
                : ""
            }
            className={cn(
              "h-9 w-full border-0 bg-transparent px-1 shadow-none focus-visible:ring-0",
              "placeholder:text-muted-foreground",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          />
        </div>
      </div>

      {diagnostics.hasErrors ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />

          <span>
            {diagnostics.invalidChips.length} invalid email
            {diagnostics.invalidChips.length > 1 ? "s" : ""}.
          </span>

          <Button
            type="button"
            variant="link"
            size="sm"
            disabled={disabled}
            onClick={clearInvalidChips}
            className="h-auto p-0 text-destructive underline-offset-4 hover:text-destructive/80"
          >
            Remove invalid emails
          </Button>
        </div>
      ) : null}
    </div>
  )
}
