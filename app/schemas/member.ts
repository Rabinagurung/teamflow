import z from "zod"

export const InviteMemberSchema = z.object({
  email: z.email(),
  name: z.string().min(3).max(50),
})
