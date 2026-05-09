"use client"

import { inviteEmailSchema } from "@/app/schemas/onboarding"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utlis/utils"
import { AlertTriangle, Mail, X } from "lucide-react"
import { useMemo, useState } from "react"

const splitTokens = (value: string) =>
  value
    .split(/[\s,;]+/g)
    .map((item) => item.trim())
    .filter(Boolean)

export type InviteEmailChip = {
  value: string
  error: string | null
}

export const getInviteEmailDiagnostics = (values: string[]) => {
  const normalizedValues = values
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  const chips: InviteEmailChip[] = normalizedValues.map((value) => {
    const parsed = inviteEmailSchema.safeParse(value)

    return {
      value,
      error: parsed.success ? null : "Invalid email address",
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
  value: string
  onChange: (value: string[]) => void
  disabled?: boolean
}

export default function InviteEmailsTextArea({
  value,
  onChange,
  disabled,
}: InviteEmailsInputProps) {
  const [draft, setDraft] = useState("")

  const diagnostics = useMemo(() => getInviteEmailDiagnostics(value), [value])

  const commitDraft = () => {
    const tokens = splitTokens(draft)

    if (tokens.length === 0) {
      setDraft("")
      return
    }

    onChange([...value, ...tokens])
    setDraft("")
  }

  const removeChipAt = (index: number) => {
    onChange(value.filter((_, currentIndex) => currentIndex !== index))
  }

  const clearInvalidChips = () => {
    onChange(diagnostics.validEmails)
  }

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "min-h-[116px] rounded-xl border bg-transparent px-3 py-3 transition",
          "border-white/15 shadow-sm",
          "focus-within:border-white/30 focus-within:ring-2 focus-within:ring-white/10",
          diagnostics.hasErrors &&
            "border-rose-400/70 focus-within:border-rose-400/80 focus-within:ring-rose-400/15",
        )}
      >
        <div className="flex max-h-[180px] flex-wrap content-start gap-2 overflow-y-auto">
          {diagnostics.chips.map((chip, index) => (
            <Badge
              key={`${chip.value}-${index}`}
              className={cn(
                "h-8 gap-2 rounded-md border px-2.5 text-sm font-medium",
                chip.error
                  ? "border-rose-400/40 bg-rose-500/15 text-rose-100"
                  : "border-sky-400/25 bg-sky-500/15 text-sky-100",
              )}
            >
              {chip.error ? (
                <AlertTriangle className="size-3.5 text-rose-300" />
              ) : (
                <Mail className="size-3.5 text-sky-300" />
              )}

              <span className="max-w-[240px] truncate">{chip.value}</span>

              <button
                type="button"
                disabled={disabled}
                onClick={() => removeChipAt(index)}
                className="rounded-sm opacity-70 transition hover:opacity-100 disabled:pointer-events-none"
              >
                <X className="size-3.5" />
              </button>
            </Badge>
          ))}
          <Textarea
            value={draft}
            disabled={disabled}
            onChange={(event) => {
              const nextValue = event.target.value

              const shouldCommit =
                /[\s,;]$/.test(nextValue) && splitTokens(nextValue).length > 0

              if (shouldCommit) {
                const tokens = splitTokens(nextValue)
                onChange([...value, ...tokens])
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
              diagnostics.chips.length === 0
                ? "anish@gmail.com, alex@company.com"
                : ""
            }
            className={cn(
              "min-h-8 flex-1 resize-none border-0 bg-transparent px-1 py-1",
              "text-base text-white shadow-none outline-none",
              "placeholder:text-white/35",
              "focus-visible:ring-0",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          />

          {/* <Textarea
            value={draft}
            disabled={disabled}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commitDraft}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" ||
                event.key === "," ||
                event.key === "Tab"
              ) {
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
              diagnostics.chips.length === 0
                ? "anish@gmail.com, alex@company.com"
                : ""
            }
            className={cn(
              "min-h-8 flex-1 resize-none border-0 bg-transparent px-1 py-1",
              "text-base text-white shadow-none outline-none",
              "placeholder:text-white/35",
              "focus-visible:ring-0",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          /> */}
        </div>
      </div>

      {diagnostics.hasErrors ? (
        <div className="flex w-fit items-center gap-2 rounded-lg border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          <AlertTriangle className="size-4 shrink-0 text-rose-300" />

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
            className="h-auto p-0 text-sky-300 hover:text-sky-200"
          >
            Remove invalid emails
          </Button>
        </div>
      ) : null}
    </div>
  )
}
