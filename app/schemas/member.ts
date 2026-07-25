import z from "zod"
import { inviteEmailSchema } from "./onboarding"

export const InviteMemberSchema = z.object({
  emails: z.array(inviteEmailSchema).min(1, "Add at least one email"),
})
