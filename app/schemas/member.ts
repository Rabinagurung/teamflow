import z from "zod"

export const InviteMemberSchema = z.object({
  email: z.email().min(1).trim(),
  role: z.enum(["member", "admin"]),
})
