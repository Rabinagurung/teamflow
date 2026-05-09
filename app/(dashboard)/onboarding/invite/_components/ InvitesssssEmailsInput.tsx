// import { onboardingInviteSchema } from "@/app/schemas/onboarding"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { cn } from "@/lib/utils/utils"
// import { useMemo, useState } from "react"
// import { Alert, AlertDescription } from "@/components/ui/alert"
// import { AlertTriangle, Mail, X } from "lucide-react"
// import { Textarea } from "@/components/ui/textarea"
// import { getInviteEmailDiagnostics } from "./InviteEmailsTextArea"

// const splitTokens = (value: string) =>
//   value
//     .split(/[\s,;]+/g)
//     .map((item) => item.trim())
//     .filter(Boolean)

// export type InviteEmailChip = {
//   value: string
//   error: string | null
// }

// export const gettInviteEmailDiagnostics = (
//   values: string[],
//   currentUserEmail?: string,
// ) => {
//   const normalizedValues = values
//     .map((value) => value.trim().toLowerCase())
//     .filter(Boolean)

//   console.log("InviteEmailChip getInviteEmailDiagnostics  ", {
//     normalizedValues,
//   })

//   const counts = new Map<string, number>()

//   console.log("InviteEmailChip getInviteEmailDiagnostics before:  ", { counts })
//   normalizedValues.forEach((value) => {
//     counts.set(value, (counts.get(value) ?? 0) + 1)
//   })

//   console.log("InviteEmailChip getInviteEmailDiagnostics after:  ", { counts })

//   const chips: InviteEmailChip[] = normalizedValues.map((value, index) => {
//     const parsed = onboardingInviteSchema.safeParse(value)

//     let error: string | null = null

//     if (!parsed.success) {
//       error = "Invalid email address"
//     } else if (
//       currentUserEmail &&
//       value === currentUserEmail.trim().toLowerCase()
//     ) {
//       error = "You cannot invite yourself"
//     } else if ((counts.get(value) ?? 0) > 1) {
//       error = "Duplicate email"
//     } else if (index >= 10) {
//       error = "You can invite up to 10 people"
//     }

//     return { value, error }
//   })

//   return {
//     chips,
//     validEmails: chips.filter((chip) => !chip.error).map((chip) => chip.value),
//     invalidChips: chips.filter((chip) => chip.error),
//     hasErrors: chips.some((chip) => chip.error),
//   }
// }

// interface InvitesssEmailsInputProps {
//   value: string[]
//   onChange: (value: string[]) => void
//   disabled?: boolean
//   currentUserEmail?: string
// }

// export default function InviteEmailsInput({
//   value,
//   onChange,
//   disabled,
//   currentUserEmail,
// }: InviteEmailsInputProps) {
//   const [draft, setDraft] = useState("")

//   const diagnostics = useMemo(
//     () => getInviteEmailDiagnostics(value, currentUserEmail),
//     [value, currentUserEmail],
//   )

//   const commitDraft = () => {
//     const tokens = splitTokens(draft)

//     if (tokens.length === 0) {
//       setDraft("")
//       return
//     }

//     onChange([...value, ...tokens])

//     setDraft("")
//   }

//   const removeChipAt = (index: number) => {
//     onChange(value.filter((_, currenrIndex) => currenrIndex !== index))
//   }

//   const clearInvalidChips = () => {
//     onChange(diagnostics.validEmails)
//   }

//   return (
//     <div className="space-y-3">
//       <div
//         className={cn(
//           "min-h-[116px] rounded-xl border bg-transparent px-3 py-3 transition",
//           "border-white/15 shadow-sm",
//           "focus-within:border-white/30 focus-within:ring-2 focus-within:ring-white/10",
//           diagnostics.hasErrors &&
//             "border-rose-400/70 focus-within:border-rose-400/80 focus-within:ring-rose-400/15",
//         )}
//       >
//         <div className="flex max-h-[180px] flex-wrap content-start gap-2 overflow-y-auto">
//           {diagnostics.chips.map((chip, index) => (
//             <Badge
//               key={`${chip.value}-${index}`}
//               className={cn(
//                 "h-8 gap-2 rounded-md border px-2.5 text-sm font-medium",
//                 chip.error
//                   ? "border-rose-400/40 bg-rose-500/15 text-rose-100"
//                   : "border-sky-400/25 bg-sky-500/15 text-sky-100",
//               )}
//             >
//               {chip.error ? (
//                 <AlertTriangle className="size-3.5 text-rose-300" />
//               ) : (
//                 <Mail className="size-3.5 text-sky-300" />
//               )}

//               <span className="max-w-[240px] truncate">{chip.value}</span>

//               <button
//                 type="button"
//                 disabled={disabled}
//                 onClick={() => removeChipAt(index)}
//                 className="rounded-sm opacity-70 transition hover:opacity-100 disabled:pointer-events-none"
//               >
//                 <X className="size-3.5" />
//               </button>
//             </Badge>
//           ))}

//           <Textarea
//             value={draft}
//             disabled={disabled}
//             onChange={(event) => setDraft(event.target.value)}
//             onBlur={commitDraft}
//             onKeyDown={(event) => {
//               if (
//                 event.key === "Enter" ||
//                 event.key === "," ||
//                 event.key === "Tab"
//               ) {
//                 event.preventDefault()
//                 commitDraft()
//               }

//               if (
//                 event.key === "Backspace" &&
//                 draft.length === 0 &&
//                 value.length > 0
//               ) {
//                 removeChipAt(value.length - 1)
//               }
//             }}
//             placeholder={
//               diagnostics.chips.length === 0
//                 ? "anish@gmail.com, alex@company.com"
//                 : ""
//             }
//             className={cn(
//               "min-h-8 flex-1 resize-none border-0 bg-transparent px-1 py-1",
//               "text-base text-white shadow-none outline-none",
//               "placeholder:text-white/35",
//               "focus-visible:ring-0",
//               "disabled:cursor-not-allowed disabled:opacity-50",
//             )}
//           />
//         </div>
//       </div>

//       {diagnostics.hasErrors ? (
//         <div className="flex w-fit items-center gap-2 rounded-lg border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
//           <AlertTriangle className="size-4 shrink-0 text-rose-300" />

//           <span>
//             {diagnostics.invalidChips.length} error
//             {diagnostics.invalidChips.length > 1 ? "s" : ""}.
//           </span>

//           <Button
//             type="button"
//             variant="link"
//             size="sm"
//             disabled={disabled}
//             onClick={clearInvalidChips}
//             className="h-auto p-0 text-sky-300 hover:text-sky-200"
//           >
//             Remove all items with errors
//           </Button>
//         </div>
//       ) : null}
//     </div>
//   )

//   //   return (
//   //     <div className="space-y-3">
//   //       <div
//   //         className={cn(
//   //           "rounded-xl border bg-background px-3 py-3 transition",
//   //           diagnostics.hasErrors
//   //             ? "border-destructive ring-destructive/20 ring-2"
//   //             : "border-input focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
//   //         )}
//   //       >
//   //         <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
//   //           {diagnostics.chips.map((chip, index) => (
//   //             <Badge
//   //               key={`${chip.value}-${index}`}
//   //               variant={chip.error ? "destructive" : "secondary"}
//   //               className={cn(
//   //                 "h-auto gap-2 rounded-md px-2.5 py-1.5 text-sm",
//   //                 !chip.error && "bg-muted text-foreground",
//   //               )}
//   //             >
//   //               {chip.error ? <AlertTriangle className="size-3.5" /> : null}
//   //               <span>{chip.value}</span>
//   //               <button
//   //                 type="button"
//   //                 disabled={disabled}
//   //                 onClick={() => removeChipAt(index)}
//   //                 className="rounded-sm opacity-70 transition hover:opacity-100"
//   //               >
//   //                 <X className="size-3.5" />
//   //               </button>
//   //             </Badge>
//   //           ))}

//   //           <Textarea
//   //             value={draft}
//   //             disabled={disabled}
//   //             onChange={(event) => setDraft(event.target.value)}
//   //             onBlur={commitDraft}
//   //             onKeyDown={(event) => {
//   //               if (
//   //                 event.key === "Enter" ||
//   //                 event.key === "," ||
//   //                 event.key === "Tab"
//   //               ) {
//   //                 event.preventDefault()
//   //                 commitDraft()
//   //               }

//   //               if (
//   //                 event.key === "Backspace" &&
//   //                 draft.length === 0 &&
//   //                 value.length > 0
//   //               ) {
//   //                 removeChipAt(value.length - 1)
//   //               }
//   //             }}
//   //             placeholder="anish@gmail.com, alex@company.com"
//   //             className="h-8 min-w-[240px] flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
//   //           />
//   //         </div>
//   //       </div>

//   //       {diagnostics.hasErrors ? (
//   //         <Alert variant="destructive">
//   //           <AlertTriangle className="size-4" />
//   //           <AlertDescription className="flex w-full items-center justify-between gap-4">
//   //             <span>
//   //               {diagnostics.invalidChips.length} invalid item
//   //               {diagnostics.invalidChips.length > 1 ? "s" : ""}. Remove or fix
//   //               them before sending.
//   //             </span>
//   //             <Button
//   //               type="button"
//   //               variant="link"
//   //               size="sm"
//   //               disabled={disabled}
//   //               onClick={clearInvalidChips}
//   //               className="h-auto p-0 text-destructive"
//   //             >
//   //               Remove invalid
//   //             </Button>
//   //           </AlertDescription>
//   //         </Alert>
//   //       ) : null}
//   //     </div>
//   //   )
// }
